from django.conf import settings

from rdflib import Graph

from rdflib_django.utils import get_named_graph

from .constants import ITEMS_NS, ITEMS_HISTORY_NS


def graph():
    return Graph(settings.RDFLIB_STORE, ITEMS_NS)


def history():
    """ Edit history of the items. """
    return get_named_graph(ITEMS_HISTORY_NS)
