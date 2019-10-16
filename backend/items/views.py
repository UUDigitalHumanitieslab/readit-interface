from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from rest_framework.status import HTTP_400_BAD_REQUEST, HTTP_404_NOT_FOUND

from rdflib import Graph, URIRef, BNode, Literal

from rdf.views import RDFView, RDFResourceView, graph_from_request, error_response
from rdf.ns import *
from vocab import namespace as vocab
from staff import namespace as staff
from ontology import namespace as ontology
from . import namespace as my
from .graph import graph
from .models import ItemCounter

MUST_SINGLE_BLANK_400 = 'POST requires exactly one subject which must be a blank node.'
MUST_EQUAL_IDENTIFIER_400 = 'PUT must affect exactly the resource URI.'
DEFAULT_NS = {
    'vocab': vocab,
    'staff': staff,
    'ontology': ontology,
    'item': my,
}


class ItemsAPIRoot(RDFView):
    """ By default, list an empty graph. """
    permission_classes = (IsAuthenticatedOrReadOnly,)
    graph = graph
    
    def get_graph(self, request):
        result = Graph()
        params = request.query_params
        if not params:
            return result
        p = params.get('p')
        p = p and URIRef(p)
        o = params.get('o')
        if o:
            o = URIRef(o)
        else:
            o = params.get('o_literal')
            o = o and Literal(o)
        for s in self.graph.subjects(p, o):
            for pred, obj in graph.predicate_objects(s):
                result.add((s, pred, obj))
        return result

    def post(self, request, format=None):
        data = graph_from_request(request)
        subjects = set(data.subjects())
        if len(subjects) != 1 or not isinstance(subjects.pop(), BNode):
            return error_response(request, HTTP_400_BAD_REQUEST, MUST_SINGLE_BLANK_400)
        counter = ItemCounter.current
        counter.increment()
        new_subject = URIRef(str(counter))
        result = Graph()
        for abbreviation, ns in DEFAULT_NS.items():
            result.bind(abbreviation, ns)
        for s, p, o in data:
            triple = (new_subject, p, o)
            result.add(triple)
            self.graph.add(triple)
        return Response(result)


class ItemsAPISingular(RDFResourceView):
    """ API endpoint for fetching and changing individual subjects. """
    permission_classes = (IsAuthenticatedOrReadOnly,)
    graph = graph

    def put(self, request, format=None, **kwargs):
        identifier = URIRef(self.get_resource_uri(request, **kwargs))
        override = graph_from_request(request)
        subjects = set(override.subjects())
        if len(subjects) != 1 or subjects.pop() != identifier:
            return error_response(request, HTTP_400_BAD_REQUEST, MUST_EQUAL_IDENTIFIER_400)
        existing = self.get_graph(request, **kwargs)
        added = override - existing
        removed = existing - override
        for triple in removed:
            graph.remove(triple)
        for triple in added:
            graph.add(triple)
        return Response(override)
