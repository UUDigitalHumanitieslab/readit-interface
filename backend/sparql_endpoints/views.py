from sparql.views import SPARQLQueryAPIView, SPARQLUpdateAPIView
from sparql_endpoints.permissions import SPARQLPermission

def sparql_query_view(endpoint_setting):
    '''
    Create a query view based on the setting for a SPARQL endpoint.

    Returns a subclass `SPARQLQueryAPIView that uses the configured graph object.
    '''

    graph = endpoint_setting['graph']

    class QueryView(SPARQLQueryAPIView):

        def graph(self):
            return graph()

    return QueryView

def sparql_update_view(endpoint_setting):
    '''
    Create an update view based on the setting for a SPARQL endpoint.

    Returns a subclass `SPARQLUpdateAPIView that uses the configured graph object
    and adds the `SPARQLPermission`
    '''

    graph = endpoint_setting['graph']

    class UpdateView(SPARQLUpdateAPIView):
        permission_classes = (SPARQLPermission,)

        def graph(self):
            return graph()

    return UpdateView
