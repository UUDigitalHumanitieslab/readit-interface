from rdflib import Graph

from django.conf import settings

from rdf.views import RDFView
from .graph import graph


class ListNlpOntology(RDFView):
    """ List the full ontology in RDF. """

    def graph(self):
        if settings.DEBUG == True:
            # return nlp ontology for local testing
            g = Graph()
            g.parse('nlp_ontology/nlp-ontology.trtl', format='turtle')
            return g
        return graph()
