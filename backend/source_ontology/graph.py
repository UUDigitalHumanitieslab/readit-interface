from django.conf import settings
from rdflib import Graph
from .constants import SOURCE_ONTOLOGY_NS


def graph():
    return Graph(settings.RDFLIB_STORE, SOURCE_ONTOLOGY_NS)
