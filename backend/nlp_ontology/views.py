import rdflib.plugins.sparql as rdf_sparql
from pyparsing import ParseException
from rest_framework.renderers import JSONRenderer
from rest_framework.response import Response
from rest_framework.status import HTTP_400_BAD_REQUEST, HTTP_406_NOT_ACCEPTABLE
from rest_framework.views import APIView

from rdf.renderers import TurtleRenderer
from rdf.utils import graph_from_triples

from .graph import graph


def render_query_results(query_results, accepted_renderer=None):
    """ Render queryresults based on 'Accept': application/json (default) or txt/turtle"""
    if isinstance(accepted_renderer, TurtleRenderer):
        return Response(graph_from_triples(query_results))
    if isinstance(accepted_renderer, JSONRenderer):
        return Response(query_results)
    return Response('Accepted media types: application/json; txt/turtle',
                    status=HTTP_406_NOT_ACCEPTABLE)


class NlpOntologyApiView(APIView):
    """ Query or update the NLP ontology using SPARQL """

    renderer_classes = (JSONRenderer, TurtleRenderer)

    def get(self, request, **kwargs):
        sparql = request.query_params.get('query')

        if not sparql:
            # GET without parameters: full ontology
            # Ignores 'Accept' header, only renders text/turtle
            # TODO: see if this can be serialized to JSON
            request.accepted_renderer = TurtleRenderer()
            return Response(graph())

        try:
            query = rdf_sparql.prepareQuery(sparql)
        except ParseException as p_e:
            return Response("Invalid query {}: {}".format(sparql, p_e.msg),
                            status=HTTP_400_BAD_REQUEST)

        query_results = graph().query(query)
        return render_query_results(query_results, request.accepted_renderer)

    def post(self, request, **kwargs):
        sparql = request.data.get('query')
        if not sparql:
            return Response("No SPARQL query provided in request body",
                            status=HTTP_400_BAD_REQUEST)

        try:
            # try if update is a valid operation for this query and succeeds
            query = rdf_sparql.prepareQuery(sparql)
            query_results = graph().update(query)
            return render_query_results(query_results, request.accepted_renderer)
        except ParseException as p_e:
            return Response("Invalid SPARQL query {}: {}".format(sparql, p_e.msg),
                            status=HTTP_400_BAD_REQUEST)
        except TypeError as t_e:
            # Update fails: try query
            pass

        try:
            # Otherwise, query
            query = rdf_sparql.prepareQuery(sparql)
            query_results = graph().query(query)
            return render_query_results(query_results, request.accepted_renderer)
        except ParseException as p_e:
            return Response("Invalid SPARQL query {}: {}".format(sparql, p_e.msg),
                            status=HTTP_400_BAD_REQUEST)
        except TypeError as t_e:
            return Response(
                "Not a valid query for UDPATE operation: {}, msg: {}".format(
                    sparql, t_e),
                status=HTTP_400_BAD_REQUEST)
