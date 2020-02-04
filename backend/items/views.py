from datetime import datetime, timezone

from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from rest_framework.status import *
from rest_framework.exceptions import ValidationError, NotFound, PermissionDenied

from rdflib import Graph, URIRef, BNode, Literal

from rdf.views import RDFView, RDFResourceView, graph_from_request
from rdf.ns import *
from rdf.utils import graph_from_triples, append_triples, traverse_forward, traverse_backward
from vocab import namespace as vocab
from staff import namespace as staff
from staff.utils import submission_info
from ontology import namespace as ontology
from . import namespace as my
from .graph import graph
from .models import ItemCounter

MUST_SINGLE_BLANK_400 = 'POST requires exactly one subject which must be a blank node.'
MUST_EQUAL_IDENTIFIER_400 = 'PUT must affect exactly the resource URI.'
MUST_BE_OWNER_403 = 'PUT is only allowed to the resource owner.'

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
    g = graph()
    user, now = submission_info(request)
    counter = ItemCounter.current
    counter.increment()
    annotation = URIRef(str(counter))
    body = BNode()
    target = BNode()
    state = BNode()
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
            return error_response(request, HTTP_404_NOT_FOUND, DOES_NOT_EXIST_404)
        user, now = submission_info(request)
        identifier = URIRef(self.get_resource_uri(request, **kwargs))
        creator = existing.value(identifier, DCTERMS.creator)
        if user != creator:
            return error_response(request, HTTP_403_FORBIDDEN, MUST_BE_OWNER_403)
        full_graph = self.graph()
        full_graph -= existing
        return Response(existing)
