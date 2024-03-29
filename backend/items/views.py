from datetime import datetime, timezone
from io import BytesIO
from rdflib.plugins.sparql.parser import BlankNode

from django.http import FileResponse, HttpResponse

from rest_framework.decorators import action, api_view, renderer_classes
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from rest_framework.status import *
from rest_framework.exceptions import ValidationError, NotFound, PermissionDenied
from rest_framework.viewsets import GenericViewSet
from rest_framework.mixins import CreateModelMixin, ListModelMixin, RetrieveModelMixin

from rdflib import Graph, URIRef, BNode, Literal
from rdflib.query import ResultException
from rdflib.plugins.sparql import prepareQuery

from rdf.views import RDFView, RDFResourceView, graph_from_request
from rdf.ns import *
from rdf.utils import graph_from_triples, append_triples, sample_graph, traverse_forward, traverse_backward
from vocab import namespace as vocab
from staff import namespace as staff
from staff.utils import submission_info
from ontology import namespace as ontology
from sources import namespace as source
from . import namespace as my
from .graph import graph, history
from .models import ItemCounter, EditCounter, SemanticQuery
from .permissions import *
from .serializers import SemanticQuerySerializer, SemanticQuerySerializerFull

MUST_SINGLE_BLANK_400 = 'POST requires exactly one subject which must be a blank node.'
MUST_EQUAL_IDENTIFIER_400 = 'PUT must affect exactly the resource URI.'
MUST_BE_OWNER_403 = 'PUT or DELETE is only allowed to the resource owner.'
BLANK_OBJECT_PREDICATE_400 = 'Blank nodes in the predicate or object positions are not allowed.'
DOES_NOT_EXIST_404 = 'Resource does not exist.'

ANNOTATION_CUTOFF = 10 # don't return more than 10 annotations when querying by category

DEFAULT_NS = {
    'vocab': vocab,
    'staff': staff,
    'ontology': ontology,
    'item': my,
}

# Terms that we use for ownership management, or that we might use in the future
RESERVED = set(DCTERMS[term] for term in '''
accessRights contributor created creator dateAccepted dateCopyrighted
dateSubmitted hasVersion identifier isReplacedBy issued isVersionOf license
modified provenance publisher relation replaces rights rightsHolder source type
valid
'''.split())

ANNO_QUERY = '''
CONSTRUCT {
    ?annotation ?a ?b.
    ?body ?c ?d.
    ?target ?e ?f.
    ?selector ?g ?h.
} WHERE {
    ?annotation oa:hasBody ?body.
    OPTIONAL { ?body ?c ?d }.
    ?annotation oa:hasTarget ?target;
                dcterms:creator ?user;
                ?a ?b.
    ?target oa:hasSource ?source;
            oa:hasSelector ?selector;
            ?e ?f.
    ?selector ?g ?h.
}
'''
ANNO_OF_CATEGORY_QUERY = '''
SELECT ?annotation ?a ?b
WHERE {
    ?annotation dcterms:creator ?user ;
        oa:hasBody ?category ;
        ?a ?b .
}
'''
ANNO_NS = {
    'oa': OA,
    'dcterms': DCTERMS,
    'rdf': RDF
}


def is_unreserved(triple):
    """ Check whether the predicate of triple is reserved. """
    s, predicate, o = triple
    return predicate not in RESERVED


def sanitize(input):
    """ Return a subset of input that excludes the reserved predicates. """
    return graph_from_triples(filter(is_unreserved, input))


def optional_int(text):
    """ Try to parse `text` as a decimal int, return None on failure. """
    try:
        return int(text)
    except:
        return None


def save_snapshot(identifier, previous, request):
    """ Keep track of the previous version of a changed item. """
    g = history()
    user, now = submission_info(request)
    counter = EditCounter.current
    uris = []
    for i in range(4):
        counter.increment()
        uris.append(URIRef(str(counter)))
    annotation, body, target, state = uris
    append_triples(g, (
        (annotation, RDF.type, OA.Annotation),
        (annotation, OA.hasBody, body),
        (annotation, OA.hasTarget, target),
        (annotation, OA.motivatedBy, OA.editing),
        (annotation, DCTERMS.creator, user),
        (target, RDF.type, OA.SpecificResource),
        (target, OA.hasSource, identifier),
        (target, OA.hasState, state),
        (state, RDF.type, OA.TimeState),
        (state, OA.sourceDate, now),
    ))
    append_triples(g, ((body, p, o) for (s, p, o) in previous))


class ItemsAPIRoot(RDFView):
    """ By default, list an empty graph. """
    permission_classes = (IsAuthenticatedOrReadOnly,)

    def graph(self):
        return graph()

    def get_graph(self, request):
        core = Graph()
        params = request.query_params
        if not params:
            return core
        # params: p - predicate, o(_literal) - object, t - traverse, r - reverse
        p = params.get('p')
        p = p and URIRef(p)
        o = params.get('o')
        if o:
            o = URIRef(o)
        else:
            o = params.get('o_literal')
            o = o and Literal(o)
        t = optional_int(params.get('t')) or 0
        r = optional_int(params.get('r')) or 0
        # Heuristic to recognize requests for annotations. Facilitates SPARQL
        # shortcut below. TODO: remove this again.
        is_annotations_request = p is None and t == 1 and r == 1 and isinstance(o, URIRef) and str(o).startswith(str(source))
        if is_annotations_request:
            bindings = {'source': o}
            # Temporary special case: show users only their own annotations,
            # unless they have special permission to see all.
            if not request.user.has_perm('rdflib_django.view_all_annotations'):
                user, now = submission_info(request)
                bindings['user'] = user
            try:
                return graph_from_triples(self.graph().query(
                    ANNO_QUERY, initBindings=bindings, initNs=ANNO_NS
                ))
            except ResultException:
                return Graph()
        # get the initial graph based on p, o, o_literal params
        full_graph = super().get_graph(request)
        subjects = set(full_graph.subjects(p, o))
        for s in subjects:
            append_triples(core, full_graph.triples((s, None, None)))
        # traverse from here based on t, r params
        children = traverse_forward(full_graph, core, t)
        parents = traverse_backward(full_graph, core, r)
        return parents | core | children

    def post(self, request, format=None):
        data = graph_from_request(request)
        subjects = set(data.subjects())
        if len(subjects) != 1 or not isinstance(subjects.pop(), BNode):
            raise ValidationError(MUST_SINGLE_BLANK_400)
        for (p, o) in data.predicate_objects():
            if isinstance(p, BNode) or isinstance(o, BNode):
                raise ValidationError(BLANK_OBJECT_PREDICATE_400)
        user, now = submission_info(request)
        counter = ItemCounter.current
        counter.increment()
        new_subject = URIRef(str(counter))
        result = Graph()
        for abbreviation, ns in DEFAULT_NS.items():
            result.bind(abbreviation, ns)
        for s, p, o in filter(is_unreserved, data):
            result.add((new_subject, p, o))
        result.add((new_subject, DCTERMS.creator, user))
        result.add((new_subject, DCTERMS.created, now))
        full_graph = super().get_graph(request)
        full_graph += result
        return Response(result, HTTP_201_CREATED)


class ItemsAPIDownload(ItemsAPIRoot):
    def get(self, request, format=None, **kwargs):
        data = super().get_graph(request, **kwargs)
        file_content = data.serialize()
        response = HttpResponse(file_content)
        response['Content-Type'] = 'application/rdf+xml'
        response['Content-Disposition'] ='attachment; filename="export.rdf"'
        return response


class ItemsAPISingular(RDFResourceView):
    """ API endpoint for fetching and changing individual subjects. """
    permission_classes = (IsAuthenticatedOrReadOnly,)

    def graph(self):
        return graph()

    def put(self, request, format=None, **kwargs):
        existing = self.get_graph(request, **kwargs)
        if len(existing) == 0:
            raise NotFound()
        identifier = URIRef(self.get_resource_uri(request, **kwargs))
        override = graph_from_request(request)
        subjects = set(override.subjects())
        if len(subjects) != 1 or subjects.pop() != identifier:
            raise ValidationError(MUST_EQUAL_IDENTIFIER_400)
        for (p, o) in override.predicate_objects():
            if isinstance(p, BNode) or isinstance(o, BNode):
                raise ValidationError(BLANK_OBJECT_PREDICATE_400)
        added = sanitize(override - existing)
        removed = sanitize(existing - override)
        if len(added) == 0 and len(removed) == 0:
            # No changes, skip database manipulations and attribution
            return Response(existing)
        save_snapshot(identifier, existing, request)
        full_graph = self.graph()
        full_graph -= removed
        full_graph += added
        return Response(existing - removed + added)

    def delete(self, request, format=None, **kwargs):
        existing = self.get_graph(request, **kwargs)
        if len(existing) == 0:
            raise NotFound(detail=DOES_NOT_EXIST_404)
        user, now = submission_info(request)
        identifier = URIRef(self.get_resource_uri(request, **kwargs))
        creator = existing.value(identifier, DCTERMS.creator)
        if user != creator and not request.user.is_superuser:
            raise PermissionDenied(detail=MUST_BE_OWNER_403)
        full_graph = self.graph()
        full_graph -= existing
        return Response(existing)


class ItemsOfCategory(RDFView):
    """ Given a category, get annotations of that category,
    taking into account user permissions. """
    def graph(self):
        return graph()

    def get_graph(self, request, category, **kwargs):
        items = self.graph()
        bindings = {'category': ontology[category]}
        if not request.user.has_perm('rdflib_django.view_all_annotations'):
            user, now = submission_info(request)
            bindings['user'] = user
            user_items = graph_from_triples(items.query(
                ANNO_OF_CATEGORY_QUERY, initBindings=bindings, initNs=ANNO_NS)
            )
        else:
            user_items = Graph()
            subjects = items.subjects(OA.hasBody, ontology[category])
            for i, s in enumerate(subjects):
                if i==ANNOTATION_CUTOFF:
                    break
                [user_items.add(triple) for triple in items.triples((s, None, None))]
        return user_items


class SemanticQueryViewSet(
    CreateModelMixin, ListModelMixin, RetrieveModelMixin,
    GenericViewSet,
):
    queryset = SemanticQuery.objects.all()

    def get_queryset(self):
        if self.action == 'list':
            if self.request.user.is_anonymous:
                return self.queryset.none()
            return self.queryset.filter(creator=self.request.user)
        return self.queryset

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return SemanticQuerySerializerFull
        else:
            return SemanticQuerySerializer
