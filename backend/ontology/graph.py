from rdflib_django.utils import get_named_graph

from .constants import ONTOLOGY_NS

def graph():
    return get_named_graph(ONTOLOGY_NS)
