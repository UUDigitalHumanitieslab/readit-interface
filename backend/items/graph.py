from rdflib_django.utils import get_named_graph

from .constants import ITEMS_NS, ITEMS_HISTORY_NS

def graph():
    return get_named_graph(ITEMS_NS)

def history():
    """ Edit history of the items. """
    return get_named_graph(ITEMS_HISTORY_NS)
