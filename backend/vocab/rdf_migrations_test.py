
from rdflib import Graph, ConjunctiveGraph, BNode, Literal

from rdf.ns import RDF, OA
from .rdf_migrations import Migration, xpath_pattern

nodes = [BNode() for i in range(9)]
graphs = [Graph() for i in range(3)]
selector = lambda n, c: Literal(xpath_pattern.format(n, c))

INPUT_QUADS = (
    # normalization should leave data unchanged that are already valid
    ( nodes[0], RDF.type,  OA.XPathSelector,        graphs[0] ),
    ( nodes[0], RDF.value, selector(0, 30),         graphs[0] ),

    # normalization should be effective
    ( nodes[1], RDF.type,  OA.XPathSelector,        graphs[0] ),
    ( nodes[1], RDF.value, selector(1, 30),         graphs[0] ),
    ( nodes[2], RDF.type,  OA.XPathSelector,        graphs[1] ),
    ( nodes[2], RDF.value, selector(2, 30),         graphs[1] ),
    ( nodes[3], RDF.type,  OA.XPathSelector,        graphs[1] ),
    ( nodes[3], RDF.value, selector(3, 30),         graphs[1] ),

    # normalization should not break on selectors that lack a value
    ( nodes[4], RDF.type,  OA.XPathSelector,        graphs[2] ),

    # normalization should not break on selectors with too many values
    ( nodes[5], RDF.type,  OA.XPathSelector,        graphs[2] ),
    ( nodes[5], RDF.value, selector(1, 30),         graphs[2] ),
    ( nodes[5], RDF.value, selector(2, 30),         graphs[2] ),

    # normalization should leave other types of resources alone
    ( nodes[6], RDF.type,  OA.TextPositionSelector, graphs[0] ),
    ( nodes[6], RDF.value, selector(3, 30),         graphs[0] ),

    # normalization should not attempt to fix unfixable XPathSelectors
    ( nodes[7], RDF.type,  OA.XPathSelector,        graphs[1] ),
    ( nodes[7], RDF.value, Literal('not an XPath'), graphs[1] ),

    # normalization should ignore coincidental xpath values
    ( nodes[8], RDF.value, selector(3, 30),         graphs[2] ),
)

EXPECTED_QUADS = (
    # normalization should leave data unchanged that are already valid
    ( nodes[0], RDF.type,  OA.XPathSelector,        graphs[0] ),
    ( nodes[0], RDF.value, selector(0, 30),         graphs[0] ),

    # normalization should be effective
    ( nodes[1], RDF.type,  OA.XPathSelector,        graphs[0] ),
    ( nodes[1], RDF.value, selector(0, 65566),      graphs[0] ),
    ( nodes[2], RDF.type,  OA.XPathSelector,        graphs[1] ),
    ( nodes[2], RDF.value, selector(0, 131102),     graphs[1] ),
    ( nodes[3], RDF.type,  OA.XPathSelector,        graphs[1] ),
    ( nodes[3], RDF.value, selector(0, 196638),     graphs[1] ),

    # normalization should not break on selectors that lack a value
    ( nodes[4], RDF.type,  OA.XPathSelector,        graphs[2] ),

    # normalization should not break on selectors with too many values
    ( nodes[5], RDF.type,  OA.XPathSelector,        graphs[2] ),
    ( nodes[5], RDF.value, selector(0, 65566),      graphs[2] ),
    ( nodes[5], RDF.value, selector(0, 131102),     graphs[2] ),

    # normalization should leave other types of resources alone
    ( nodes[6], RDF.type,  OA.TextPositionSelector, graphs[0] ),
    ( nodes[6], RDF.value, selector(3, 30),         graphs[0] ),

    # normalization should not attempt to fix unfixable XPathSelectors
    ( nodes[7], RDF.type,  OA.XPathSelector,        graphs[1] ),
    ( nodes[7], RDF.value, Literal('not an XPath'), graphs[1] ),

    # normalization should ignore coincidental xpath values
    ( nodes[8], RDF.value, selector(3, 30),         graphs[2] ),
)

def test_normalize_xpath_character_indices():
    g_actual, g_expected = ConjunctiveGraph(), ConjunctiveGraph()
    g_actual.addN(INPUT_QUADS)
    g_expected.addN(EXPECTED_QUADS)
    # input graph is different from the expected graph
    assert len(g_expected ^ g_actual) > 0
    Migration.normalize_xpath_character_indices(None, None, g_actual)
    # normalized graph is identical to the expected graph
    assert len(g_expected ^ g_actual) == 0
