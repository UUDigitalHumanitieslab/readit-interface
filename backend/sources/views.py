import os
from datetime import datetime, timezone
from django.core.files.storage import default_storage
from django.conf import settings

from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework.status import *
from rest_framework.parsers import MultiPartParser
from rest_framework.exceptions import ValidationError, NotFound

from rdflib import Graph, URIRef, Literal
from rdflib_django.utils import get_conjunctive_graph

from rdf.ns import *
from rdf.views import RDFView, RDFResourceView
from rdf.utils import graph_from_triples, prune_triples_cascade
from vocab import namespace as vocab
from staff.utils import submission_info
from items.graph import graph as items_graph
from .graph import graph as sources_graph
from .utils import get_media_filename
from .models import SourcesCounter
from .permissions import UploadSourcePermission, DeleteSourcePermission


def inject_fulltext(input):
    """ Return a copy of input that has the fulltext for each source. """
    subjects = set(input.subjects())
    text_triples = Graph()
    for s in subjects:
        serial = get_serial_from_subject(s)
        with default_storage.open(get_media_filename(serial)) as f:
            text_triples.add((s, SCHEMA.text, Literal(f.read())))
    return input + text_triples


def get_serial_from_subject(subject):
    return str(subject).split('/')[-1]


class SourcesAPIRoot(RDFView):
    """ For now, simply lists all sources. """

    def graph(self):
        return sources_graph()

    def get_graph(self, request, **kwargs):
        return inject_fulltext(super().get_graph(request, **kwargs))


class SourcesAPISingular(RDFResourceView):
    """ API endpoint for fetching individual subjects. """
    permission_classes = [IsAuthenticated, DeleteSourcePermission]

    def graph(self):
        return sources_graph()

    def get_graph(self, request, **kwargs):
        return inject_fulltext(super().get_graph(request, **kwargs))

    def delete(self, request, format=None, **kwargs):
        source_uri = request.build_absolute_uri(request.path)
        existing = self.get_graph(request, **kwargs)
        if len(existing) == 0:
            raise NotFound('Source \'{}\' not found'.format(source_uri))
        conjunctive = get_conjunctive_graph()
        prune_triples_cascade(conjunctive, existing, [sources_graph])
        annotations = conjunctive.triples((None, OA.hasSource, URIRef(source_uri)))
        for s, p, o in annotations:
            prune_triples_cascade(conjunctive, ((s, p, o),), [items_graph])
        return Response(existing)



class AddSource(RDFResourceView):
    permission_classes = [IsAuthenticated, UploadSourcePermission]
    parser_classes = [MultiPartParser]

    def store(self, file, destination):
        with open(destination, 'wb+') as destination:
            for chunk in file.chunks():
                destination.write(chunk)

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

        # store the file
        destination = os.path.join(settings.MEDIA_ROOT, get_media_filename(
            get_serial_from_subject(new_subject)))
        self.store(data['source'], destination)

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
