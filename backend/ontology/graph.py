from django.conf import settings

from rdflib import Graph

from .constants import ONTOLOGY_NS


def graph():
    return Graph(settings.RDFLIB_STORE, ONTOLOGY_NS)
