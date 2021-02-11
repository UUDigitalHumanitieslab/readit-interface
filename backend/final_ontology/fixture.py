from .constants import SOURCE, SOURCE_FORMAT, SOURCE_PREFIX, FINAL_ONTOLOGY_NS
from rdflib import Graph
from ontology.fixture import replace_prefix

SOURCE_PREFIX_CLASS = 'http://dataforhistory.org/read-it-ongoing/class/'
SOURCE_PREFIX_PROPERTY = 'http://dataforhistory.org/read-it-ongoing/property/'


def remove_slashes(graph):
    pass


def canonical_graph():
    """
    Returns the graph from our external source, with fixes.

    If different, SOURCE_PREFIX is replaced by ONTOLOGY_NS in all
    URIRefs.
    """
    g = Graph()
    g.parse(SOURCE, format=SOURCE_FORMAT)

    if SOURCE_PREFIX != FINAL_ONTOLOGY_NS:
        g2 = replace_prefix(g, SOURCE_PREFIX_CLASS, FINAL_ONTOLOGY_NS)
        g3 = replace_prefix(g2, SOURCE_PREFIX_PROPERTY, FINAL_ONTOLOGY_NS)
        return g3

    return g
