from rdflib import Graph

from rdf.views import RDFView
from .graph import graph


class ItemsEndpoint(RDFView):
    """ By default, list an empty graph. """
    def get_graph(self, request):
        return Graph()
