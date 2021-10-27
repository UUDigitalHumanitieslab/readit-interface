import logging

from django.conf import settings
from rdflib import Graph

from ontology.fixture import replace_prefix
from .constants import NLP_ONTOLOGY_NS, NLP_NS, INSTANCE_NLP_NS

logger = logging.getLogger(__name__)


def graph():
    logger.debug('computing graph in nlp_ontology.graph')
    if settings.DEBUG == True:
        logger.debug('constructing local testing graph')
        # return nlp ontology for local testing
        g = Graph()
        g.parse('nlp_ontology/nlp-ontology.trtl', format='turtle')
    else:
        logger.debug('loading graph from SPARQL store')
        g = Graph(settings.RDFLIB_STORE, NLP_ONTOLOGY_NS)
    g = replace_prefix(g, NLP_NS, INSTANCE_NLP_NS)
    return g
