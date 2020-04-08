import rdflib.plugins.sparql as rdf_sparql
from pyparsing import ParseException
from rest_framework.renderers import JSONRenderer
from rest_framework.response import Response
from rest_framework.status import HTTP_400_BAD_REQUEST, HTTP_406_NOT_ACCEPTABLE
from rest_framework.views import APIView

from rdf.renderers import TurtleRenderer
from rdf.utils import graph_from_triples

from .graph import graph


class NlpOntologyApiView(APIView):
    """ Query or update the full ontology using SPARQL """
    renderer_classes = (JSONRenderer, TurtleRenderer)

    def get(self, request, **kwargs):
        sparql = request.query_params.get('query') or None
        if not sparql:
            return Response(graph())

        try:
            query = rdf_sparql.prepareQuery(sparql)
            query_results = graph().query(query)

            a_r = request.accepted_renderer
            if isinstance(a_r, TurtleRenderer):
                return Response(graph_from_triples(query_results))
            if isinstance(a_r, JSONRenderer):
                return Response(query_results)
            return Response('Accepted media types: application/json; text/turtle',
                            status=HTTP_406_NOT_ACCEPTABLE)
        except ParseException as p_e:
            return Response("Invalid query {}: {}".format(sparql, p_e.msg), status=HTTP_400_BAD_REQUEST)
