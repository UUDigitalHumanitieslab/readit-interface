from django.conf import settings

from rdflib import Graph

from .constants import ITEMS_NS, ITEMS_HISTORY_NS


def graph():
    return Graph(settings.RDFLIB_STORE, ITEMS_NS)


def history():
    """ Edit history of the items. """
    return Graph(settings.RDFLIB_STORE, ITEMS_HISTORY_NS)
