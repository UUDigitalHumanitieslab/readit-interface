
from rdflib import Graph, ConjunctiveGraph, BNode, Literal

from rdf.ns import RDF, OA
from . import namespace as my
from .rdf_migrations import *

nodes = [BNode() for i in range(13)]
graphs = [Graph() for i in range(3)]
selector = lambda n, c: Literal(xpath_pattern.format(n, c))

PRE_NORMALIZE_CHUNKS = (
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

POST_NORMALIZE_CHUNKS = (
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

PRE_POSITION_SELECTORS = POST_NORMALIZE_CHUNKS + (
    # conversion to position stors should do the job on expected range stors
    ( nodes[9],  RDF.type,                my.RangeSelector,        graphs[0] ),
    ( nodes[9],  OA.hasStartSelector,     nodes[0],                graphs[0] ),
    ( nodes[9],  OA.hasEndSelector,       nodes[1],                graphs[0] ),

    ( nodes[10], RDF.type,                my.RangeSelector,        graphs[1] ),
    ( nodes[10], OA.hasStartSelector,     nodes[2],                graphs[1] ),
    ( nodes[10], OA.hasEndSelector,       nodes[3],                graphs[1] ),

    # conversion to position stors should not break on corrupt range stors
    ( nodes[11], RDF.type,                my.RangeSelector,        graphs[2] ),
    ( nodes[11], OA.hasStartSelector,     nodes[4],                graphs[2] ),
    ( nodes[11], OA.hasEndSelector,       nodes[5],                graphs[2] ),

    # conversion to position stors should not break on very corrupt range stors
    ( nodes[12], RDF.type,                my.RangeSelector,        graphs[1] ),
    ( nodes[12], OA.hasStartSelector,     nodes[7],                graphs[1] ),
)

POST_POSITION_SELECTORS = POST_NORMALIZE_CHUNKS + (
    # conversion to position stors should do the job on expected range stors
    ( nodes[9],  RDF.type,                OA.TextPositionSelector, graphs[0] ),
    ( nodes[9],  OA.hasStartSelector,     nodes[0],                graphs[0] ),
    ( nodes[9],  OA.start,                Literal(30),             graphs[0] ),
    ( nodes[9],  OA.hasEndSelector,       nodes[1],                graphs[0] ),
    ( nodes[9],  OA.end,                  Literal(65566),          graphs[0] ),

    ( nodes[10], RDF.type,                OA.TextPositionSelector, graphs[1] ),
    ( nodes[10], OA.hasStartSelector,     nodes[2],                graphs[1] ),
    ( nodes[10], OA.start,                Literal(131102),         graphs[1] ),
    ( nodes[10], OA.hasEndSelector,       nodes[3],                graphs[1] ),
    ( nodes[10], OA.end,                  Literal(196638),         graphs[1] ),

    # conversion to position stors should not break on corrupt range stors
    ( nodes[11], RDF.type,                OA.TextPositionSelector, graphs[2] ),
    ( nodes[11], OA.hasStartSelector,     nodes[4],                graphs[2] ),
    ( nodes[11], OA.hasEndSelector,       nodes[5],                graphs[2] ),
    ( nodes[11], OA.end,                  Literal(65566),          graphs[2] ),
    ( nodes[11], OA.end,                  Literal(131102),         graphs[2] ),

    # conversion to position stors should not break on very corrupt range stors
    ( nodes[12], RDF.type,                OA.TextPositionSelector, graphs[1] ),
    ( nodes[12], OA.hasStartSelector,     nodes[7],                graphs[1] ),
)


def test_normalize_xpath_character_indices():
    g_actual, g_expected = ConjunctiveGraph(), ConjunctiveGraph()
    g_actual.addN(PRE_NORMALIZE_CHUNKS)
    g_expected.addN(POST_NORMALIZE_CHUNKS)
    # input graph is different from the expected graph
    assert len(g_expected ^ g_actual) > 0
    Migration.normalize_xpath_character_indices(None, None, g_actual)
    # normalized graph is identical to the expected graph
    assert len(g_expected ^ g_actual) == 0


def test_find_character_positions():
    g = ConjunctiveGraph()
    g.addN(PRE_POSITION_SELECTORS)
    assert find_character_positions(g, nodes[9], graphs[0], True) == [30]
    assert find_character_positions(g, nodes[9], graphs[0], False) == [65566]
    assert find_character_positions(g, nodes[10], graphs[1], True) == [131102]
    assert find_character_positions(g, nodes[10], graphs[1], False) == [196638]
    assert find_character_positions(g, nodes[11], graphs[2], True) == []
    assert sorted(find_character_positions(g, nodes[11], graphs[2], False)) == [65566, 131102]
    assert find_character_positions(g, nodes[12], graphs[1], True) == []
    assert find_character_positions(g, nodes[12], graphs[1], False) == []


def test_use_position_selectors():
    g_actual, g_expected = ConjunctiveGraph(), ConjunctiveGraph()
    g_actual.addN(PRE_POSITION_SELECTORS)
    g_expected.addN(POST_POSITION_SELECTORS)
    # input graph is different from the expected graph
    assert len(g_expected ^ g_actual) > 0
    Migration.use_position_selectors(None, None, g_actual)
    # graph after migration is identical to the expected graph
    assert len(g_expected ^ g_actual) == 0
    Migration.use_position_selectors(None, None, g_actual)
    # migration is idempotent
    assert len(g_expected ^ g_actual) == 0
