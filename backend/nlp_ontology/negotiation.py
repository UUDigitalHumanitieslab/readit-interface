from rest_framework.negotiation import DefaultContentNegotiation

from nlp_ontology.renderers import (QueryResultsJSONRenderer,
                                    QueryResultsTurtleRenderer)
from rdf.renderers import TurtleRenderer


class SPARQLContentNegotiator(DefaultContentNegotiation):
    results_renderers = (QueryResultsJSONRenderer, QueryResultsTurtleRenderer)
    rdf_renderers = (TurtleRenderer,)

    def select_renderer(self, request, renderers, format_suffix=None):
        query_type = request.data.get('query_type', None)

        if query_type in ('ASK', 'SELECT'):
            renderers = [renderer() for renderer in self.results_renderers]
        if query_type in ('EMPTY',):
            renderers = [renderer() for renderer in self.rdf_renderers]

        return super().select_renderer(request, renderers, format_suffix)
