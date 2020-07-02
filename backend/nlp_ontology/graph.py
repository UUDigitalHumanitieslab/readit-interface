from django.conf import settings
from rdflib import Graph

from .constants import NLP_ONTOLOGY_NS


def graph():
    return Graph(settings.RDFLIB_STORE, NLP_ONTOLOGY_NS)
