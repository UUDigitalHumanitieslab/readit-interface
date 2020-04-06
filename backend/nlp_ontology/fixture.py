"""
This module represents what we believe *should* be in .graph.graph().
"""

from rdflib import Graph, URIRef, Literal

from rdf.ns import *

from . import namespace as my
from .constants import SOURCE, SOURCE_FORMAT, SOURCE_PREFIX, NLP_ONTOLOGY_NS

REPARSE_FORMAT = 'n3'


def replace_prefix(graph_in, prefix_in, prefix_out):
    """
    Return a new graph in which SOURCE_PREFIX is replaced by NLP_ONTOLOGY_NS.

    This function works by serializing `graph_in` to bytes, textually
    replacing the prefix and then parsing the result into a new Graph.
    Not efficient; do not use for large graphs.
    """
    if type(prefix_in) == str:
        prefix_in = prefix_in.encode()
    if type(prefix_out) == str:
        prefix_out = prefix_out.encode()
    serialized = graph_in.serialize(format=REPARSE_FORMAT)
    replaced = serialized.replace(prefix_in, prefix_out)
    graph_out = Graph()
    graph_out.parse(data=replaced, format=REPARSE_FORMAT)
    return graph_out


def canonical_graph():
    """
    Returns the graph from our external source, with fixes.

    If different, SOURCE_PREFIX is replaced by ONTOLOGY_NS in all
    URIRefs.
    """
    g = Graph()
    g.parse(SOURCE, format=SOURCE_FORMAT)
    if SOURCE_PREFIX != NLP_ONTOLOGY_NS:
        return replace_prefix(g, SOURCE_PREFIX, NLP_ONTOLOGY_NS)
    return g
