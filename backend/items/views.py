from rest_framework.response import Response
from rest_framework.status import HTTP_400_BAD_REQUEST, HTTP_404_NOT_FOUND

from rdflib import Graph, URIRef, BNode, Literal

from rdf.views import RDFView
from rdf.ns import *
from vocab import namespace as vocab
from staff import namespace as staff
from ontology import namespace as ontology
from . import namespace as my
from .graph import graph
from .models import ItemCounter

MUST_SINGLE_BLANK_400 = 'POST requires exactly one subject which must be a blank node.'
MUST_EQUAL_IDENTIFIER_400 = 'PUT must affect exactly the resource URI.'
DOES_NOT_EXIST_404 = 'Resource does not exist.'
DEFAULT_NS = {
    'vocab': vocab,
    'staff': staff,
    'ontology': ontology,
    'item': my,
}
HTTPSC_MAP = {
    HTTP_400_BAD_REQUEST: HTTPSC.BadRequest,
    HTTP_404_NOT_FOUND: HTTPSC.NotFound,
}


def graph_from_request(request):
    """ Safely obtain a graph, from the request if present, empty otherwise. """
    data = request.data
    if not isinstance(data, Graph):
        data = Graph()
    return data


def error_response(request, status, message):
    """ Return an RDF-encoded 4xx page that includes any request data. """
    data = graph_from_request(request)
    req = BNode()
    res = BNode()
    for triple in (
        (req, RDF.type, HTTP.Request),
        (req, HTTP.mthd, HTTPM[request.method]),
        (req, HTTP.resp, res),
        (res, RDF.type, HTTP.Response),
        (res, HTTP.sc, HTTPSC_MAP[status]),
        (res, HTTP.statusCodeValue, Literal(status)),
        (res, HTTP.reasonPhrase, Literal(message)),
    ): data.add(triple)
    return Response(data, status=status)


class ItemsAPIRoot(RDFView):
    """ By default, list an empty graph. """
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
        for s in graph.subjects(p, o):
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
            graph.add(triple)
        return Response(result)


class ItemsAPISingular(RDFView):
    """ API endpoint for fetching and changing individual subjects. """

    def get(self, request, serial, format=None, **kwargs):
        data = self.get_graph(request, serial)
        if len(data) == 0:
            return error_response(request, HTTP_404_NOT_FOUND, DOES_NOT_EXIST_404)
        return Response(data)

    def get_graph(self, request, serial, **kwargs):
        # warning: query params will cause an uncaught exception.
        identifier = my[str(serial)]
        result = Graph()
        for triple in graph.triples((identifier, None, None)):
            result.add(triple)
        # TODO: also include related nodes
        return result

    def put(self, request, serial, format=None, **kwargs):
        identifier = my[str(serial)]
        override = graph_from_request(request)
        subjects = set(override.subjects())
        if len(subjects) != 1 or subjects.pop() != identifier:
            return error_response(request, HTTP_400_BAD_REQUEST, MUST_EQUAL_IDENTIFIER_400)
        existing = self.get_graph(request, serial)
        added = override - existing
        removed = existing - override
        for triple in removed:
            graph.remove(triple)
        for triple in added:
            graph.add(triple)
        return Response(override)