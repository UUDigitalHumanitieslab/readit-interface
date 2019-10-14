from rdf.views import RDFView
from .graph import graph

class ListStaff(RDFView):
    """ List the full staff in RDF. """
    def get_graph(self, request, **kwargs):
        return graph()
