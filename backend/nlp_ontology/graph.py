from django.conf import settings
from rdflib import Graph

from ontology.fixture import replace_prefix
from .constants import NLP_ONTOLOGY_NS, NLP_NS, INSTANCE_NLP_NS


def graph():
    if settings.DEBUG == True:
        # return nlp ontology for local testing
        g = Graph()
        g.parse('nlp_ontology/nlp-ontology.trtl', format='turtle')
        g = replace_prefix(g, NLP_NS, INSTANCE_NLP_NS)
        return g
    return Graph(settings.RDFLIB_STORE, NLP_ONTOLOGY_NS)
