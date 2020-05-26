import json
from io import StringIO

from rdflib.plugins.sparql.results.jsonresults import JSONResultSerializer
from rest_framework.renderers import JSONRenderer

from rdf.renderers import TurtleRenderer
from rdf.utils import graph_from_triples


class QueryResultsTurtleRenderer(TurtleRenderer):
    ''' Renders turtle from rdflib SPARQL query results'''

    def render(self, query_results, media_type=None, renderer_context=None):
        results_graph = graph_from_triples(query_results)
        return super(QueryResultsTurtleRenderer,
                     self).render(results_graph, media_type, renderer_context)


class QueryResultsJSONRenderer(JSONRenderer):
    ''' Renders SPARQL Query Results JSON Format from rdflib query results'''
    # media_type = 'application/sparql-results+json'
    media_type = 'application/json'
    format = 'srj'

    def render(self, query_results, media_type=None, renderer_context=None):
        stream = StringIO()
        JSONResultSerializer(query_results).serialize(stream)
        json_str = stream.getvalue()
        stream.close()
        serialized_results = json.loads(json_str)
        return super(QueryResultsJSONRenderer, self).render(serialized_results,
                                                            media_type,
                                                            renderer_context)
