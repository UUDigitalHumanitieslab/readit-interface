from rdflib_django.utils import get_named_graph

from .constants import VOCAB_NS

def graph():
    return get_named_graph(VOCAB_NS)
