from .constants import SOURCE, SOURCE_FORMAT, SOURCE_PREFIX, FINAL_ONTOLOGY_NS
from rdflib import Graph
from ontology.fixture import replace_prefix


def canonical_graph():
    """
    Returns the graph from our external source, with fixes.

    If different, SOURCE_PREFIX is replaced by ONTOLOGY_NS in all
    URIRefs.
    """
    g = Graph()
    g.parse(SOURCE, format=SOURCE_FORMAT)
    if SOURCE_PREFIX != FINAL_ONTOLOGY_NS:
        return replace_prefix(g, SOURCE_PREFIX, FINAL_ONTOLOGY_NS)
    return g
