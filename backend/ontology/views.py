from rdf.views import RDFView
from .graph import graph

class ListOntology(RDFView):
    """ List the full ontology in RDF. """
    graph = graph
