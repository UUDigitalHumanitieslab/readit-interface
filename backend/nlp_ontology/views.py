import rdflib.plugins.sparql as rdf_sparql
from django.http.response import HttpResponseBase
from pyparsing import ParseException
from rest_framework.authentication import (BasicAuthentication,
                                           SessionAuthentication)
from rest_framework.exceptions import APIException
from rest_framework.response import Response
from rest_framework.views import APIView

from rdf.renderers import TurtleRenderer

from rdf.views import custom_exception_handler as turtle_exception_handler

from .exceptions import NoParamError, ParseSPARQLError
from .graph import graph
from .negotiation import SPARQLContentNegotiator
from .permissions import SPARQLPermission


class SPARQLUpdateAPIView(APIView):
    def get_exception_handler(self):
        return turtle_exception_handler

    def execute_update(self, updatestring):
        try:
            return graph().update(updatestring)
        except ParseException as p_e:
            # Raised when SPARQL syntax is not valid, or parsing fails
            raise ParseSPARQLError(p_e)

    def post(self, request, **kwargs):
        ''' Accepts POST request with SPARQL-Query in body parameter 'query'
            Renders text/turtle
        '''
        sparql_string = request.data.get('update')
        if not sparql_string:
            # POST must contain an update
            raise NoParamError()

        self.execute_update(sparql_string)
        return Response({'message': 'Updated successfully.', 'status': True})


class SPARQLQueryAPIView(APIView):
    renderer_classes = (TurtleRenderer,)
    authentication_classes = (SessionAuthentication, BasicAuthentication)
    content_negotiation_class = SPARQLContentNegotiator

    def get_exception_handler(self):
        return turtle_exception_handler

    def finalize_response(self, request, response, *args, **kwargs):
        """
        Adapts APIView method to additionaly perform content negotation
        when a query type was set
        """
        assert isinstance(response, HttpResponseBase), (
            'Expected a `Response`, `HttpResponse` or `HttpStreamingResponse` '
            'to be returned from the view, but received a `%s`'
            % type(response)
        )

        if isinstance(response, Response):
            # re-perform content negotiation if a query type was set
            if (not getattr(request, 'accepted_renderer', None) or
                    self.request.data.get('query_type', None)):
                neg = self.perform_content_negotiation(request, force=True)
                request.accepted_renderer, request.accepted_media_type = neg

            response.accepted_renderer = request.accepted_renderer
            response.accepted_media_type = request.accepted_media_type
            response.renderer_context = self.get_renderer_context()

        for key, value in self.headers.items():
            response[key] = value

        return response

    def execute_query(self, querystring):
        ''' Attempt to query a graph with a SPARQL-Query string
            Sets query type on succes
        '''
        try:
            if not querystring:
                query_results = graph()
                query_type = 'EMPTY'
            else:
                prepared_query = rdf_sparql.prepareQuery(querystring)
                query_results = graph().query(prepared_query)
                query_type = query_results.type
            self.request.data['query_type'] = query_type
            return query_results

        except ParseException as p_e:
            # Raised when SPARQL syntax is not valid, or parsing fails
            raise ParseSPARQLError(p_e)
        except Exception as n_e:
            raise APIException(n_e)

    def get(self, request, **kwargs):
        ''' Accepts GET request with optional SPARQL-Query in query parameter 'query'
            Without 'query' parameter, returns the entire graph as text/turtle
            Renders application/json or text/turtle based on query type and header 'Accept
        '''
        sparql_string = request.query_params.get('query')
        query_results = self.execute_query(sparql_string)
        return Response(query_results)

    def post(self, request, **kwargs):
        ''' Accepts POST request with SPARQL-Query in body parameter 'query'
            Renders application/json or text/turtle based on query type and header 'Accept'
        '''
        sparql_string = request.data.get('query')
        if not sparql_string:
            raise NoParamError()
        request.data._mutable = True  # request.data is immutable for POST requests
        query_results = self.execute_query(sparql_string)

        return Response(query_results)


class NlpOntologyQueryView(SPARQLQueryAPIView):
    """ Query the NLP ontology through SPARQL-Query """
    authentication_classes = (SessionAuthentication, BasicAuthentication)

    def graph(self):
        return graph()


class NlpOntologyUpdateView(APIView):
    """ Update the NLP ontology through SPARQL-Update """
    permission_classes = (SPARQLPermission,)
    authentication_classes = (SessionAuthentication, BasicAuthentication)
