from rdf.views import RDFView
from .graph import graph
from nlp_ontology.graph import graph as nlp_graph


class ListOntology(RDFView):
    """ List the full ontology in RDF. """

    def graph(self):
        return graph()
