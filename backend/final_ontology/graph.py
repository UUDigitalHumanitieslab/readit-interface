from django.conf import settings

from rdflib import Graph

from .constants import FINAL_ONTOLOGY_NS


def graph():
    return Graph(settings.RDFLIB_STORE, FINAL_ONTOLOGY_NS)
