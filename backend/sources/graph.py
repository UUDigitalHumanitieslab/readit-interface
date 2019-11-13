from rdflib_django.utils import get_named_graph

from .constants import SOURCES_NS

def graph():
    return get_named_graph(SOURCES_NS)
