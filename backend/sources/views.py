import logging
import os
from datetime import datetime, timezone
import html
import functools
import operator
import ast
import requests
from requests.utils import quote

from django.http import HttpResponse, JsonResponse
from django.core.files.storage import default_storage
from django.conf import settings
from django.contrib.admin.utils import flatten

from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework.status import *
from rest_framework.mixins import UpdateModelMixin
from rest_framework.parsers import MultiPartParser
from rest_framework.exceptions import ValidationError, NotFound
from rest_framework.reverse import reverse

from rdflib import BNode, Graph, URIRef, Literal
from rdflib.plugins.sparql import prepareQuery

from elasticsearch import Elasticsearch

from rdf.ns import *
from rdf.views import RDFView, RDFResourceView
from rdf.utils import graph_from_triples, prune_triples_cascade, get_conjunctive_graph, sample_graph
from vocab import namespace as vocab
from staff.utils import submission_info
from items.constants import ITEMS_NS
from items.graph import graph as items_graph
from sparql.utils import invalid_xml_remove
from . import namespace as ns
from .constants import SOURCES_NS
from .graph import graph as sources_graph
from .utils import get_media_filename, get_serial_from_subject, parse_isodate
from .models import SourcesCounter
from .permissions import UploadSourcePermission, DeleteSourcePermission
from .tasks import poll_automated_annotations
from source_ontology import namespace as source_ontology

es = Elasticsearch(
    hosts=[{'host': settings.ES_HOST, 'port': settings.ES_PORT}])

# Get sources logger for logging on server
logger = logging.getLogger(__name__)

LITERALS = {
    'title': source_ontology.title,
    'author': source_ontology.author,
    'editor': source_ontology.editor,
    'publisher': source_ontology.publisher,
    'repository': source_ontology.repository,
    'url': source_ontology.url
}
URIS = {
    'type': source_ontology.sourceType,
}
DATES = {
    'publicationdate': source_ontology.datePublished,
    'creationdate': source_ontology.dateCreated,
    'retrievaldate': source_ontology.dateRetrieved
}

SELECT_SOURCES_QUERY_START = '''
CONSTRUCT {
    ?id ?p ?o.
'''

SELECT_SOURCES_QUERY_MIDDLE_RELEVANCE = '''
    ?id vocab:relevance ?relevance.
} WHERE {
   VALUES (?id ?relevance) {
'''

SELECT_SOURCES_QUERY_MIDDLE_NO_RELEVANCE = '''
} WHERE {
   VALUES ?id {
'''

SELECT_SOURCES_QUERY_END = '''
}
    ?id ?p ?o
}
'''
PREFIXES = {
    'oa': OA,
}
SOURCE_EXISTS_QUERY = 'ASK { ?source ?a ?b }'
SOURCE_DELETE_QUERY = '''
DELETE {{
    GRAPH <{0}> {{
        ?source ?a ?b
    }}
    GRAPH <{1}> {{
        ?annotation ?c ?d.
        ?target ?e ?f.
        ?selector ?g ?h.
    }}
}} WHERE {{
    GRAPH <{0}> {{
        ?source ?a ?b
    }}
    OPTIONAL {{
        GRAPH <{1}> {{
            ?annotation oa:hasTarget ?target;
                        ?c ?d.
            ?target oa:hasSource ?source;
                    oa:hasSelector ?selector;
                    ?e ?f.
            ?selector ?g ?h.
        }}
    }}
}}
'''.format(SOURCES_NS, ITEMS_NS)


def inject_fulltext(input, inline, request):
    """
    Return a copy of graph `input` that has the fulltext for each source.

    If `inline` is true, add a `SCHEMA.text` property with the text verbatim.
    Otherwise, add a `vocab.fullText` property with a URI that dereferences to
    the text.
    """
    subjects = set(input.subjects())
    text_triples = Graph()
    for s in subjects:
        serial = get_serial_from_subject(s)
        if inline:
            result = es.search(body={
                "query": {
                    "term": {"id": serial}
                }
            }, index=settings.ES_ALIASNAME)
            f = result['hits']['hits'][0]['_source']['text']
            text_triples.add((s, SCHEMA.text, Literal(f)))
        else:
            text_triples.add((s, source_ontology.fullText, URIRef(reverse(
                'sources:fulltext',
                kwargs={'serial': serial},
                request=request,
            ))))
    return input + text_triples


class SourcesAPIRoot(RDFView):
    """ For now, simply lists all sources. """

    def graph(self):
        return sources_graph()

    def get_graph(self, request, **kwargs):
        return inject_fulltext(super().get_graph(request, **kwargs), False, request)


class SourceSelection(RDFView):
    ''' list all sources related to a search query. '''

    def get_graph(self, request, **kwargs):
        body = construct_es_body(request)
        from_value = 0
        page = request.GET.get('page')
        if page:
            from_value = (int(page)-1) * settings.RESULTS_PER_PAGE
        results = es.search(body=body, index=settings.ES_ALIASNAME,
                            size=settings.RESULTS_PER_PAGE, from_=from_value)
        if results['hits']['total']['value'] == 0:
            return Graph()
        selected_sources = select_sources_elasticsearch(results)
        selected_sources_graph = inject_fulltext(
            graph_from_triples(list(selected_sources)), False, request)
        return selected_sources_graph


class SourceHighlights(RDFView):
    '''
    view to perform query highlighting in the full text source
    with Elasticsearch
    '''

    def get_graph(self, request, **kwargs):
        query = request.GET.get('query')
        if query == '':
            query = '*'
        fields = request.GET.get('fields')
        source = request.GET.get('source')
        if not query or not source:
            raise NotFound
        serial = get_serial_from_subject(source)
        body = self.construct_es_body(serial, query, fields)
        results = es.search(body=body, index=settings.ES_ALIASNAME)
        try:
            highlights = results['hits']['hits'][0]['highlight']
        except KeyError:
            return Graph()
        highlight_graph = self.construct_highlight_graph(highlights)
        return highlight_graph

    def construct_es_body(self, serial, query, fields):
        if fields == 'all':
            fields_query = {
                "text*": {},
                "author": {},
                "title": {}
            }
        elif fields == 'author':
            fields_query = {
                "author": {}
            }
        elif fields == 'title':
            fields_query = {
                "title": {}
            }
        else:
            fields_query = {
                "text*": {}
            }
        body = {
            "query": {
                "term": {"id": serial}
            },
            "highlight": {
                "highlight_query": {
                    "simple_query_string": {
                        "query": query
                    }
                },
                "fields": fields_query,
                "fragment_size": 50,
                "number_of_fragments": 3,
                "pre_tags": ["<mark>"],
                "post_tags": ["</mark>"]
            }
        }
        return body

    def construct_highlight_graph(self, highlights):
        hg = Graph()
        for key in highlights.keys():
            if key == 'author':
                obj = SCHEMA.author
            elif key == 'title':
                obj = DCTERMS.title
            else:
                obj = SCHEMA.text
            subj = BNode()
            hg.add((subj, RDF.type, OA.Annotation))
            hg.add((subj, OA.hasTarget, obj))
            for highlight in highlights.get(key):
                if obj == SCHEMA.text:
                    # add ellipses to start or end of string
                    if not highlight[0].isupper():
                        highlight = '(...) {}'.format(highlight)
                    if not highlight[-1] in ['?', '.', '!']:
                        highlight = '{} (...)'.format(highlight)
                hg.add((subj, OA.hasBody, Literal(highlight)))
        return hg


class SourcesAPISingular(RDFResourceView):
    """ API endpoint for fetching individual subjects. """
    permission_classes = [
        IsAuthenticated,
        DeleteSourcePermission
    ]

    def graph(self):
        return sources_graph()

    def get_graph(self, request, **kwargs):
        return inject_fulltext(super().get_graph(request, **kwargs), True, request)
    
    def patch(self, request, format=None, **kwargs):
        data = ast.literal_eval(request.body.decode('utf-8'))
        source_uri = get_source_uri(request)
        existing_graph = self.graph()
        new = format_source_data(URIRef(source_uri), data)
        for triple in new:
            query = (triple[0], triple[1], None)
            if query in existing_graph:
                existing_triple = existing_graph.triples(query)
                existing_graph -= existing_triple
        existing_graph += graph_from_triples(tuple(new))
        serial = get_serial_from_subject(source_uri)
        self.update_elastic(serial, data)
        resulting_graph = graph_from_triples(
            existing_graph.triples((URIRef(source_uri), None, None))
        )
        return Response(resulting_graph, HTTP_200_OK)

    def update_elastic(self, serial, data):
        ''' update data in Elasticsearch '''
        keys = ['author', 'title', 'language', 'public']
        doc = {key: data.get(key) for key in keys if key in data}
        if 'public' in doc:
            doc['public'] = (doc['public'] == 'public')
        if 'language' in doc:
            result = es.search(
                index=settings.ES_ALIASNAME,
                body={"query": {
                    "term": {
                        "id": serial
                    }
                }}
            )
            existing = result['hits']['hits'][0]
            original_language = existing['_source']['language']
            set_language = doc['language']
            if set_language != original_language:
                doc['text_{}'.format(original_language)] = None
                if set_language != 'other':
                    doc['text_'.format(set_language)] = existing['_source']['text']     
        if not doc:
            return None
        body={
            "doc": doc
        }   
        try: 
            es.update(
                index=settings.ES_ALIASNAME,
                id=serial,
                body=body
            )
        except Exception as e:
            logger.error(e)

    def delete(self, request, format=None, **kwargs):
        source_uri = get_source_uri(request)
        bindings = self.assure_source_exists(source_uri)
        conjunctive = get_conjunctive_graph()
        conjunctive.update(
            SOURCE_DELETE_QUERY, initNs=PREFIXES, initBindings=bindings
        )
        serial = get_serial_from_subject(source_uri)
        es.delete_by_query(
            index=settings.ES_ALIASNAME,
            body={"query": {
                "match": {
                    "id": serial
                }
            }}
        )
        return Response(Graph(), HTTP_204_NO_CONTENT)
    
    def assure_source_exists(self, source_uri):
        bindings = {'source': URIRef(source_uri)}
        if not self.graph().query(SOURCE_EXISTS_QUERY, initBindings=bindings):
            raise NotFound('Source \'{}\' not found'.format(source_uri))
        return bindings, source_uri

def source_valid(data):
    is_valid = True
    missing_fields = []
    required_fields = ['title', 'author',
                       'source', 'language', 'type', 'publicationdate', 'public']
    for f in required_fields:
        if not data.get(f, False):
            is_valid = False
            missing_fields.append(f)
    return is_valid, missing_fields

def source_fulltext(request, serial, query=None):
    """ API endpoint for fetching the full text of a single source. """
    body = {
        "query": {
            "term": {"id": serial}
        }
    }
    result = es.search(body=body, index=settings.ES_ALIASNAME)
    if result:
        f = result['hits']['hits'][0]['_source']['text']
        return HttpResponse(f, content_type='text/plain; charset=utf-8')
    else:
        raise NotFound

def get_source_uri(request):
    source_uri = request.build_absolute_uri()
    return source_uri

def select_sources_elasticsearch(results):
    endpoint = sources_graph()
    selection = '\n'.join(
        list(map(format_ids_and_relevances, results['hits']['hits'])))
    query = '{}{}{}{}'.format(
        SELECT_SOURCES_QUERY_START,
        SELECT_SOURCES_QUERY_MIDDLE_RELEVANCE,
        selection,
        SELECT_SOURCES_QUERY_END
    )
    return endpoint.query(query, initNs={'source': ns, 'vocab': vocab})


def format_ids_and_relevances(hit):
    return '(source:{} {})'.format(hit['_source']['id'], hit['_score'])


class AddSource(RDFResourceView):
    permission_classes = [IsAuthenticated, UploadSourcePermission]
    parser_classes = [MultiPartParser]

    def store(self, source_file, source_id, source_language, author, title, public):
        """ sanitize and store the text in an Elasticsearch index
        return the sanitized text
        """
        raw_text = str(source_file.read().decode('utf8'))
        xml_sanitized_text = invalid_xml_remove(raw_text)
        text = html.escape(xml_sanitized_text)
        es.index(settings.ES_ALIASNAME, {
            'id': source_id,
            'language': source_language,
            'author': author,
            'title': title,
            'text': text,
            'text_{}'.format(source_language): text,
            'public': public
        })
        return text

    def query_automated_annotations(self, text, uploaded_file, uri):
        headers = {'Authorization': 'Token token={}'.format(
            settings.IRISA_TOKEN)}
        queue = "standard" if len(text) < 50000 else "batch"
        job_parameters = ("--has-source {}".format(quote(uri, '')))
        files = {
            'job[webapp_id]': (None, '1042'),
            'job[queue]': (None, queue),
            'files[0]': ('file', text.encode('utf-8')),
            'job[param]': (None, job_parameters)
        }
        response = requests.post(
            '{}/jobs'.format(settings.IRISA_URL), headers=headers, files=files)
        if response:
            job_id = response.json().get('id')
            # set the time for the query timeout:
            # 20 minutes for small texts, 24 hours for large texts
            timeout = 1200 if queue == 'standard' else 86400
            poll_automated_annotations.delay(job_id, timeout)
        else:
            logger.warning(
                "Failed to send request for automated annotations for source {}".format(uri))

    def post(self, request, format=None):
        data = request.data
        is_valid, missing_fields = source_valid(data)
        if not is_valid:
            raise ValidationError(
                detail="Missing fields: {}".format(", ".join(missing_fields)))

        # get unique URI for source
        counter = SourcesCounter.current
        counter.increment()
        new_subject = URIRef(str(counter))

        # store the file in ES index
        sanitized_text = self.store(data['source'], get_serial_from_subject(new_subject),
                                    data['language'], data['author'], data['title'], data['public']=='public')

        self.query_automated_annotations(
            sanitized_text, data['source'], counter.__str__())

        # create graph
        triples = format_source_data(new_subject, data)
        result = graph_from_triples(tuple(triples))
        user, now = submission_info(request)
        result.add((new_subject, DCTERMS.creator, user))
        result.add((new_subject, source_ontology.dateUploaded, now))

        # add to store
        full_graph = sources_graph()
        # below stores result automagically
        full_graph += result

        return Response(result, HTTP_201_CREATED)


def construct_es_body(request):
    query_string = request.GET.get('query')
    fields = request.GET.get('fields')
    if query_string == '':
        clause = {"match_all": {}}
    else:
        es_query = {"query": query_string}
        if fields != 'all':
            es_query['fields'] = [fields]
        clause = {"simple_query_string": es_query}
    body = {"query": clause}
    return body

def get_number_search_results(request):
    body = construct_es_body(request)
    results = es.search(body=body, index=settings.ES_ALIASNAME, size=0)
    response = {'total_results': results['hits']['total']
                ['value'], 'results_per_page': settings.RESULTS_PER_PAGE}
    return JsonResponse(response)

def format_source_data(subject, data):
    
    triples = []
    for l in literals:
        value = data.get(l)
        if value:
            triples.append((subject, literals[l], Literal(value)))
    for u in uris:
        value = data.get(u)
        if value:
            triples.append((subject, uris[u], URIRef(value)))
    for d in dates:
        value = data.get(d)
        if value:
            triples.append((subject, dates[d], parse_isodate(value)))
    if data.get('public'):
        triples.append(subject, source_ontology.public,
            resolve_access(data['public']))
    if data.get('language'):
        triples.append(subject, source_ontology.language, URIRef(
            resolve_language(data['language'])))
    return triples

def resolve_language(input_language):
    known_languages = {
        'en': ISO6391.en,
        'de': ISO6391.de,
        'nl': ISO6391.nl,
        'fr': ISO6391.fr,
        'it': ISO6391.it,
        'cs': ISO6391.cs
    }
    result = known_languages.get(input_language)
    if result:
        return result
    else:
        return UNKNOWN
        
def resolve_access(value):
    if value == 'public':
        return Literal('true', datatype=XSD.boolean)
    return Literal('false', datatype=XSD.boolean)
    