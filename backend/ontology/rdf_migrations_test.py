from rdflib import ConjunctiveGraph, BNode

from rdf.ns import *
from rdf.utils import graph_from_triples
from . import namespace as READIT
from .rdf_migrations import *

BLESSINGTON = BNode()
READ_FRENCH_POEMS = BNode()

BEFORE = graph_from_triples((
    (BLESSINGTON, RDF.type, READIT.reader),
    (BLESSINGTON, READIT.carries_out, READ_FRENCH_POEMS),
    (READ_FRENCH_POEMS, RDF.type, READIT.reading_session),
    (READ_FRENCH_POEMS, READIT.is_carried_out_by, BLESSINGTON),
), ConjunctiveGraph)

AFTER = graph_from_triples((
    (BLESSINGTON, RDF.type, READIT.reader),
    (BLESSINGTON, READIT.carried_out, READ_FRENCH_POEMS),
    (READ_FRENCH_POEMS, RDF.type, READIT.reading_session),
), ConjunctiveGraph)

LEFT_DIFFERENCE = graph_from_triples((
    (BLESSINGTON, READIT.carries_out, READ_FRENCH_POEMS),
    (READ_FRENCH_POEMS, READIT.is_carried_out_by, BLESSINGTON),
), ConjunctiveGraph)

RIGHT_DIFFERENCE = graph_from_triples((
    (BLESSINGTON, READIT.carried_out, READ_FRENCH_POEMS),
), ConjunctiveGraph)


def test_replace_predicate():
    assert len(BEFORE ^ AFTER) == 3
    assert len((BEFORE - AFTER) ^ LEFT_DIFFERENCE) == 0
    assert len((AFTER - BEFORE) ^ RIGHT_DIFFERENCE) == 0
    replace_predicate(
        BEFORE,
        READIT.carries_out,
        READIT.is_carried_out_by,
        READIT.carried_out,
    )
    assert len(BEFORE ^ AFTER) == 0
