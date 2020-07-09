from django.conf import settings

from rdflib import Graph

from .constants import VOCAB_NS


def graph():
    return Graph(settings.RDFLIB_STORE, VOCAB_NS)
