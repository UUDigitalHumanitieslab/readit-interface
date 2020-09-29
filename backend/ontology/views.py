from rdf.views import RDFView
from rdf.utils import sample_graph
from .graph import graph

class ListOntology(RDFView):
    """ List the full ontology in RDF. """

    def graph(self):
        return graph()