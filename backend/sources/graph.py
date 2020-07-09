from django.conf import settings

from rdflib import Graph

from .constants import SOURCES_NS


def graph():
    return Graph(settings.RDFLIB_STORE, SOURCES_NS)
