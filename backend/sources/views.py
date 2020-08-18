import os
from datetime import datetime, timezone
import html

from django.http import HttpResponse
from django.core.files.storage import default_storage
from django.conf import settings

from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework.status import *
from rest_framework.parsers import MultiPartParser
from rest_framework.exceptions import ValidationError, NotFound
from rest_framework.reverse import reverse

from rdflib import Graph, URIRef, Literal

from elasticsearch import Elasticsearch

from rdf.ns import *
from rdf.views import RDFView, RDFResourceView
from rdf.utils import graph_from_triples, prune_triples_cascade, get_conjunctive_graph
from vocab import namespace as vocab
from staff.utils import submission_info
from items.constants import ITEMS_NS
from items.graph import graph as items_graph
from .constants import SOURCES_NS
from .graph import graph as sources_graph
from .utils import get_media_filename, get_serial_from_subject
from .models import SourcesCounter
from .permissions import UploadSourcePermission, DeleteSourcePermission

es = Elasticsearch(hosts=[{'host': settings.ES_HOST, 'port': settings.ES_PORT}])

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
                "query" : {
                    "term" : { "id" : serial }
                    }
                }, index=settings.ES_ALIASNAME)
            if result:
                f = result['hits']['hits'][0]['_source']['text']
                text_triples.add((s, SCHEMA.text, Literal(f)))
        else:
            text_triples.add((s, vocab.fullText, URIRef(reverse(
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


class SourcesAPISingular(RDFResourceView):
    """ API endpoint for fetching individual subjects. """
    permission_classes = [IsAuthenticated, DeleteSourcePermission]

    def graph(self):
        return sources_graph()

    def get_graph(self, request, **kwargs):
        return inject_fulltext(super().get_graph(request, **kwargs), True, request)

    def delete(self, request, format=None, **kwargs):
        source_uri = request.build_absolute_uri(request.path)
        bindings = {'source': URIRef(source_uri)}
        if not self.graph().query(SOURCE_EXISTS_QUERY, initBindings=bindings):
            raise NotFound('Source \'{}\' not found'.format(source_uri))
        conjunctive = get_conjunctive_graph()
        conjunctive.update(
            SOURCE_DELETE_QUERY, initNs=PREFIXES, initBindings=bindings
        )
        serial = get_serial_from_subject(source_uri)
        es.delete_by_query(
            index=settings.ES_ALIASNAME, 
            body= { "query": {
                "match": {
                    "id": serial
                }
            }}
        )
        return Response(Graph(), HTTP_204_NO_CONTENT)


def source_fulltext(request, serial):
    """ API endpoint for fetching the full text of a single source. """
    result = es.search(body={
        "query" : {
            "term" : { "id" : serial }
        }
    }, index=settings.ES_ALIASNAME)
    if result:
        f = result['hits']['hits'][0]['_source']['text']
        return HttpResponse(f, content_type='text/plain; charset=utf-8')
    return Response(status=HTTP_404_NOT_FOUND)


class AddSource(RDFResourceView):
    permission_classes = [IsAuthenticated, UploadSourcePermission]
    parser_classes = [MultiPartParser]

    def store(self, source_file, source_id, source_language):
        text = html.escape(str(source_file.read().decode('utf8')))
        es.index(settings.ES_ALIASNAME, {
            'id': source_id,
            'language': source_language,
            'text': text,
            'text_{}'.format(source_language): text
        })

    def is_valid(self, data):
        is_valid = True
        missing_fields = []
        required_fields = ['title', 'author', 'source', 'language', 'type', 'pubdate']

        for f in required_fields:
            if not data.get(f, False):
                is_valid = False
                missing_fields.append(f)

        return is_valid, missing_fields

    def resolve_language(self, input_language):
        known_languages = {
            'en': ISO6391.en,
            'de': ISO6391.de,
            'nl': ISO6391.nl,
            'fr': ISO6391.fr,
        }
        result = known_languages.get(input_language)
        if result:
            return result
        else:
            return UNKNOWN

    def resolve_type(self, input_type):
        known_types = {
            'book': SCHEMA.Book,
            'article': SCHEMA.Article,
            'review': SCHEMA.Review,
            'socialmediaposting': SCHEMA.SocialMediaPosting,
            'webcontent': SCHEMA.WebContent
        }
        result = known_types.get(input_type)
        if result:
            return result
        else:
            return UNKNOWN

    def parse_date(self, input_date):
        dt = datetime.strptime(input_date, "%Y/%m/%d")
        return dt.replace(tzinfo=timezone.utc)

    def get_required(self, new_subject, data):
        return [
            (new_subject, RDF.type, vocab.Source),
            (new_subject, RDF.type, URIRef(self.resolve_type(data['type']))),
            (new_subject, SCHEMA.name, Literal(data['title'])),
            (new_subject, SCHEMA.author, Literal(data['author'])),
            (new_subject, SCHEMA.creator, Literal(data['author'])),
            (new_subject, SCHEMA.inLanguage, URIRef(
                self.resolve_language(data['language']))),
            (new_subject, SCHEMA.datePublished, Literal(
                self.parse_date(data['pubdate'])))
        ]

    def get_optional(self, new_subject, data):
        literals = {
            'editor': SCHEMA.editor,
            'publisher': SCHEMA.publisher,
        }
        uris = {
            'url': OWL.sameAs
        }

        optionals = []
        for l in literals:
            value = data.get(l)
            if value:
                optionals.append((new_subject, literals[l], Literal(value)))

        for u in uris:
            value = data.get(u)
            if value:
                optionals.append((new_subject, uris[u], URIRef(value)))

        return optionals

    def post(self, request, format=None):
        data = request.data
        is_valid, missing_fields = self.is_valid(data)
        if not is_valid:
            raise ValidationError(detail="Missing fields: {}".format(", ".join(missing_fields)))

        # get unique URI for source
        counter = SourcesCounter.current
        counter.increment()
        new_subject = URIRef(str(counter))

        # store the file in ES index
        language = data['language']
        self.store(data['source'], get_serial_from_subject(new_subject), language)

        # TODO: voor author en editor een instantie van SCHEMA.Person maken? Of iets uit CIDOC/ontologie?
        # create graph
        triples = self.get_required(new_subject, data)
        triples.extend(self.get_optional(new_subject, data))
        result = graph_from_triples(tuple(triples))
        user, now = submission_info(request)
        result.add((new_subject, DCTERMS.creator, user))
        result.add((new_subject, DCTERMS.created, now))

        # add to store
        full_graph = sources_graph()
        # below stores result automagically
        full_graph += result

        return Response(result, HTTP_201_CREATED)
