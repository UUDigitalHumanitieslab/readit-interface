from datetime import datetime, timezone

from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from rest_framework.status import *

from rdflib import Graph, URIRef, BNode, Literal

from rdf.views import RDFView, RDFResourceView, graph_from_request, error_response, DOES_NOT_EXIST_404
from rdf.ns import *
from vocab import namespace as vocab
from staff import namespace as staff
from staff.views import get_user_uriref
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
    output = Graph()
    for s, p, o in filter(is_unreserved, input):
        output.add((s, p, o))
    return output


def submission_info(request):
    """ Return user and datetime of request as RDF terms. """
    user = get_user_uriref(request)
    now = Literal(datetime.now(timezone.utc))
    return user, now


def optional_int(text):
    """ Try to parse `text` as a decimal int, return None on failure. """
    try:
        return int(text)
    except:
        return None


class ItemsAPIRoot(RDFView):
    """ By default, list an empty graph. """
    permission_classes = (IsAuthenticatedOrReadOnly,)

    def graph(self):
        return graph()

    def get_graph(self, request):
        result = Graph()
        params = request.query_params
        if not params:
            return result
        # params: p - predicate, o(_literal) - object, t - traverse, r - reverse
        p = params.get('p')
        p = p and URIRef(p)
        o = params.get('o')
        if o:
            o = URIRef(o)
        else:
            o = params.get('o_literal')
            o = o and Literal(o)
        t = optional_int(params.get('t'))
        r = optional_int(params.get('r'))
        # get the initial graph based on p, o, o_literal params
        full_graph = super().get_graph(request)
        subjects = set(full_graph.subjects(p, o))
        for s in subjects:
            for pred, obj in full_graph.predicate_objects(s):
                result.add((s, pred, obj))
        # traverse from here based on t, r params
        fringe = result
        visited_objects = set()
        while t and t > 0:
            objects = set(fringe.objects()) - visited_objects
            if not len(objects):
                break
            fringe = Graph()
            for o in objects:
                if not isinstance(o, Literal):
                    for triple in full_graph.triples((o, None, None)):
                        fringe.add(triple)
            result |= fringe
            visited_objects |= objects
            t -= 1
        visited_subjects = set()
        while r and r > 0:
            if not len(subjects):
                break
            fringe = Graph()
            for s in subjects:
                for ss in full_graph.subjects(None, s):
                    for triple in full_graph.triples((ss, None, None)):
                        fringe.add(triple)
            result |= fringe
            visited_subjects |= subjects
            subjects = set(fringe.subjects()) - visited_subjects
            r -= 1
        return result

    def post(self, request, format=None):
        data = graph_from_request(request)
        subjects = set(data.subjects())
        if len(subjects) != 1 or not isinstance(subjects.pop(), BNode):
            return error_response(request, HTTP_400_BAD_REQUEST, MUST_SINGLE_BLANK_400)
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
            return error_response(request, HTTP_404_NOT_FOUND, DOES_NOT_EXIST_404)
        user, now = submission_info(request)
        identifier = URIRef(self.get_resource_uri(request, **kwargs))
        creator = existing.value(identifier, DCTERMS.creator)
        if user != creator:
            return error_response(request, HTTP_403_FORBIDDEN, MUST_BE_OWNER_403)
        override = graph_from_request(request)
        subjects = set(override.subjects())
        if len(subjects) != 1 or subjects.pop() != identifier:
            return error_response(request, HTTP_400_BAD_REQUEST, MUST_EQUAL_IDENTIFIER_400)
        added = sanitize(override - existing)
        removed = sanitize(existing - override)
        if len(added) == 0 and len(removed) == 0:
            # No changes, skip database manipulations and attribution
            return Response(existing)
        added.add((identifier, DCTERMS.modified, now))
        full_graph = super().get_graph(request)
        full_graph -= removed
        full_graph += added
        return Response(existing - removed + added)
