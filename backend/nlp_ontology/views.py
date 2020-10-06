from rdf.views import RDFView
from .graph import graph


class ListNlpOntology(RDFView):
    """ List the full ontology in RDF. """

    def graph(self):
        return graph()
