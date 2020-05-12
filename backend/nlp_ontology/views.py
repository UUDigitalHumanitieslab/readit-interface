import rdflib.plugins.sparql as rdf_sparql
from pyparsing import ParseException
from rest_framework.exceptions import APIException, ParseError
from rest_framework.renderers import JSONRenderer
from rest_framework.response import Response
from rest_framework.status import HTTP_400_BAD_REQUEST, HTTP_406_NOT_ACCEPTABLE
from rest_framework.views import APIView, exception_handler
from rest_framework.authentication import BasicAuthentication, SessionAuthentication

from rdf.renderers import TurtleRenderer
from rdf.utils import graph_from_triples
from rdf.views import custom_exception_handler as turtle_exception_handler

from .graph import graph
from .permissions import SPARQLPermission


class NoParamError(APIException):
    status_code = 400
    default_detail = 'No SPARQL-Query or SPARQL-Update in query or update body parameters.'
    default_code = 'sparql_no_param_error'


class ParseSPARQLError(APIException):
    status_code = 400
    default_detail = 'Error parsing SPARQL.'
    default_code = 'sparql_parse_error'


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
    try:
        prepared_query = rdf_sparql.prepareQuery(querystring)
        return graph().query(prepared_query)
    except ParseException as p_e:
        # Raised when SPARQL syntax is not valid, or parsing fails
        raise ParseError(p_e)


def execute_update(updatestring):
    try:
        return graph().update(updatestring)
    except ParseException as p_e:
        # Raised when SPARQL syntax is not valid, or parsing fails
        raise ParseError(p_e)


def sparql_exception_handler(error, context):
    response = exception_handler(error, context)
    if response is not None:
        response.data['status_code'] = response.status_code
    return response


class NlpOntologyQueryView(APIView):
    """ Query the NLP ontology through SPARQL-Query """
    renderer_classes = (JSONRenderer, TurtleRenderer)

    def get_exception_handler(self):
        if isinstance(self.request.accepted_renderer, TurtleRenderer):
            return turtle_exception_handler
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
        return render_query_results(query_results,
                                    request.accepted_renderer)

    def post(self, request, **kwargs):
        ''' Accepts POST request with SPARQL-Query in body parameter 'query'
            Renders application/json or text/turtle based on  header 'Accept'
        '''
        sparql_string = request.data.get('query')
        if not sparql_string:
            raise NoParamError()

        query_results = execute_query(sparql_string)
        return render_query_results(query_results, request.accepted_renderer)


class NlpOntologyUpdateView(APIView):
    """ Update the NLP ontology through SPARQL-Update """
    renderer_classes = (TurtleRenderer,)
    permission_classes = (SPARQLPermission,)
    authentication_classes = (SessionAuthentication, BasicAuthentication)

    def get_exception_handler(self):
        return turtle_exception_handler

    def post(self, request, **kwargs):
        ''' Accepts POST request with SPARQL-Query in body parameter 'query'
            Renders text/turtle
        '''
        sparql_string = request.data.get('update')
        if not sparql_string:
            # POST must contain an update
            raise NoParamError()

        execute_update(sparql_string)
        return Response(graph())
