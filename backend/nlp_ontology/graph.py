from rdflib_django.utils import get_named_graph

from .constants import NLP_ONTOLOGY_NS


def graph():
    return get_named_graph(NLP_ONTOLOGY_NS)
