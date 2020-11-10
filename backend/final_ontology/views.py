from rdf.views import RDFView
from .graph import graph


class ListFinalOntology(RDFView):
    """ List the full final ontology in RDF. """

    def graph(self):
        return graph()
