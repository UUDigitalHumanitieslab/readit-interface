from rest_framework.response import Response
from rest_framework.status import HTTP_400_BAD_REQUEST

from rdflib import Graph, BNode, Literal

from rdf.views import RDFView
from rdf.ns import *
from . import namespace as my
from .graph import graph

MUST_SINGLE_BLANK_400 = 'POST requires exactly one subject which must be a blank node.'


class ItemsEndpoint(RDFView):
    """ By default, list an empty graph. """
    def get_graph(self, request):
        return Graph()

    def post(self, request, format=None):
        subjects = list(request.data.subjects())
        if len(subjects) != 1 or not isinstance(subjects[0], BNode):
            req = BNode()
            res = BNode()
            for triple in (
                (req, RDF.type, HTTP.Request),
                (req, HTTP.mthd, HTTPM.POST),
                (req, HTTP.resp, res),
                (res, RDF.type, HTTP.Response),
                (res, HTTP.sc, HTTPSC.BadRequest),
                (res, HTTP.statusCodeValue, Literal(400)),
                (res, HTTP.reasonPhrase, Literal(MUST_SINGLE_BLANK_400)),
            ): request.data.add(triple)
            return Response(request.data, status=HTTP_400_BAD_REQUEST)
        return Response(request.data)
