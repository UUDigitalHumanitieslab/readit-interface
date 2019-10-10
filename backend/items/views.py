from rest_framework.response import Response
from rest_framework.status import HTTP_400_BAD_REQUEST

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
DEFAULT_NS = {
    'vocab': vocab,
    'staff': staff,
    'ontology': ontology,
    'item': my,
}
HTTPSC_MAP = {
    HTTP_400_BAD_REQUEST: HTTPSC.BadRequest,
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


class ItemsEndpoint(RDFView):
    """ By default, list an empty graph. """
    def get_graph(self, request):
        return Graph()

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
