import json
from io import StringIO

import rdflib.plugins.sparql as rdf_sparql
from pyparsing import ParseException
from rdflib.plugins.sparql.results.jsonresults import JSONResultSerializer
from rest_framework.authentication import (BasicAuthentication,
                                           SessionAuthentication)
from rest_framework.renderers import JSONRenderer
from rest_framework.response import Response
from rest_framework.views import APIView, exception_handler
from rest_framework.exceptions import APIException

from rdf.renderers import TurtleRenderer
from rdf.utils import graph_from_triples
from rdf.views import custom_exception_handler as turtle_exception_handler

from .exceptions import NoParamError, ParseSPARQLError
from .graph import graph
from .permissions import SPARQLPermission


class QueryResultsTurtleRenderer(TurtleRenderer):
    ''' Renders turtle from rdflib SPARQL query results'''

    def render(self, query_results, media_type=None, renderer_context=None):
        results_graph = graph_from_triples(query_results)
        return super(QueryResultsTurtleRenderer,
                     self).render(results_graph, media_type, renderer_context)


def serialize_sparql_json(query_results):
    stream = StringIO()
    JSONResultSerializer(query_results).serialize(stream)
    json_str = stream.getvalue()
    stream.close()
    return json.loads(json_str)


def execute_query(querystring):
    try:
        prepared_query = rdf_sparql.prepareQuery(querystring)
        query_results = graph().query(prepared_query)

        return serialize_sparql_json

    except ParseException as p_e:
        # Raised when SPARQL syntax is not valid, or parsing fails
        raise ParseSPARQLError(p_e)
    except Exception as n_e:
        raise APIException(n_e)


def execute_update(updatestring):
    try:
        return graph().update(updatestring)
    except ParseException as p_e:
        # Raised when SPARQL syntax is not valid, or parsing fails
        raise ParseSPARQLError(p_e)


def sparql_exception_handler(error, context):
    accepted_renderer = getattr(context['request'], 'accepted_renderer', None)
    if isinstance(accepted_renderer, QueryResultsTurtleRenderer):
        return turtle_exception_handler

    response = exception_handler(error, context)
    if response is not None:
        response.data['status_code'] = response.status_code
    return response


class NlpOntologyQueryView(APIView):
    """ Query the NLP ontology through SPARQL-Query """
    renderer_classes = (JSONRenderer, QueryResultsTurtleRenderer)

    def get_exception_handler(self):
        return sparql_exception_handler

    def get(self, request, **kwargs):
        ''' Accepts SPARQL-Query in query paramter 'query'
            Renders application/json or text/turtle based on header 'Accept'
        '''
        sparql_string = request.query_params.get('query')
        if not sparql_string:
            # GET without parameters: full ontology
            # Ignores 'Accept' header, only renders text/turtle
            request.accepted_renderer = TurtleRenderer()
            return Response(graph())

        query_results = execute_query(sparql_string)
        return Response(query_results)

    def post(self, request, **kwargs):
        ''' Accepts POST request with SPARQL-Query in body parameter 'query'
            Renders application/json or text/turtle based on  header 'Accept'
        '''
        sparql_string = request.data.get('query')
        if not sparql_string:
            raise NoParamError()

        query_results = execute_query(sparql_string)
        return Response(query_results)


class NlpOntologyUpdateView(APIView):
    """ Update the NLP ontology through SPARQL-Update """
    permission_classes = (SPARQLPermission,)
    authentication_classes = (SessionAuthentication, BasicAuthentication)

    def post(self, request, **kwargs):
        ''' Accepts POST request with SPARQL-Query in body parameter 'query'
            Renders text/turtle
        '''
        sparql_string = request.data.get('update')
        if not sparql_string:
            # POST must contain an update
            raise NoParamError()

        execute_update(sparql_string)
        return Response({'message': 'Updated successfully.', 'status': True})
