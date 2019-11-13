from rdflib_django.utils import get_named_graph

from .constants import ITEMS_NS

def graph():
    return get_named_graph(ITEMS_NS)
