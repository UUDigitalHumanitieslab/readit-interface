import rdflib.plugins.sparql as rdf_sparql
from pyparsing import ParseException
from rest_framework.authentication import (BasicAuthentication,
                                           SessionAuthentication)
from rest_framework.permissions import IsAuthenticated
from rest_framework.renderers import JSONRenderer
from rest_framework.response import Response
from rest_framework.status import HTTP_400_BAD_REQUEST, HTTP_406_NOT_ACCEPTABLE
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated
from rest_framework.authentication import SessionAuthentication, BasicAuthentication

from rdf.renderers import TurtleRenderer
from rdf.utils import graph_from_triples

from .graph import graph
from .permissions import SPARQLPermission


def render_query_results(query_results, accepted_renderer=None):
    ''' Render results bases on 'Accept' header:
        application/json (default) or txt/turtle '''
    if isinstance(accepted_renderer, TurtleRenderer):
        return Response(graph_from_triples(query_results))
    if isinstance(accepted_renderer, JSONRenderer):
        return Response(query_results)
    return Response('Accepted media types: application/json; txt/turtle',
                    status=HTTP_406_NOT_ACCEPTABLE)


def execute_query(querystring):
    prepared_query = rdf_sparql.prepareQuery(querystring)
    return graph().query(prepared_query)


def execute_update(updatestring):
    return graph().update(updatestring)


class NlpOntologyQueryView(APIView):
    """ Query the NLP ontology through SPARQL-Query """
    renderer_classes = (JSONRenderer, TurtleRenderer)
    authentication_classes = (SessionAuthentication, BasicAuthentication)

    def get(self, request, **kwargs):
        ''' Accepts SPARQL-Query in query paramter 'query'
            Outputs application/json or text/turtle based on header 'Accept'
        '''
        sparql_string = request.query_params.get('query')

        if not sparql_string:
            # GET without parameters: full ontology
            # Ignores 'Accept' header, only renders text/turtle
            # TODO: see if this can be serialized to JSON
            request.accepted_renderer = TurtleRenderer()
            return Response(graph())

        try:
            query_results = execute_query(sparql_string)
            return render_query_results(query_results,
                                        request.accepted_renderer)
        except ParseException as p_e:
            return Response("Invalid query {}: {}".format(sparql_string, p_e.msg),
                            status=HTTP_400_BAD_REQUEST)

    def post(self, request, **kwargs):
        ''' Accepts POST request with SPARQL-Query in body parameter 'query'
            TODO: Optionally provide namespaces in body parameters 'prefix'
            Outputs application/json or text/turtle based on  header 'Accept'
        '''
        sparql_string = request.data.get('query')
        print(sparql_string)

        if not sparql_string:
            return Response('No SPARQL-Query in body parameter "query"',
                            status=HTTP_400_BAD_REQUEST)

        try:
            query_results = execute_query(sparql_string)
            return render_query_results(query_results,
                                        request.accepted_renderer)
        except ParseException as p_e:
            # Raised when SPARQL syntax is not valid, or parsing fails
            return Response(p_e.msg, status=HTTP_400_BAD_REQUEST)


class NlpOntologyUpdateView(APIView):
    """ Update the NLP ontology through SPARQL-Update """
    renderer_classes = (JSONRenderer, TurtleRenderer)
    permission_classes = (SPARQLPermission, IsAuthenticated)
    authentication_classes = (SessionAuthentication, BasicAuthentication)

    def post(self, request, **kwargs):
        ''' Accepts POST request with SPARQL-Query in body parameter 'query'
            Outputs application/json or text/turtle based on  header 'Accept'
            TODO:
            Optionally provide namespaces in body parameters 'prefix'
        '''
        sparql_string = request.data.get('update')

        if not sparql_string:
            # POST must contain an update
            return Response("No SPARQL-Update in body parameter 'update'",
                            status=HTTP_400_BAD_REQUEST)

        try:
            execute_update(sparql_string)
            request.accepted_renderer = TurtleRenderer()
            return Response(graph())
        except ParseException as p_e:
            return Response("Invalid SPARQL query {}: {}".format(sparql, p_e.msg),
                            status=HTTP_400_BAD_REQUEST)
        except TypeError as t_e:
            return Response(
                "Not a valid query for UDPATE operation: {}, msg: {}".format(
                    sparql, t_e),
                status=HTTP_400_BAD_REQUEST)
