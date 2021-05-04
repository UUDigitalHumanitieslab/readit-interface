from rdflib import ConjunctiveGraph, BNode, Literal

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

def test_replace_property_of():
    BALD = BNode()
    BOOK = BNode()
    HEAVY = BNode()

    conjunctive = graph_from_triples((
        (BLESSINGTON, RDF.type, READIT.reader),
        (BALD, RDF.type, READIT.reader_properties),
        (BALD, READIT.property_of, BLESSINGTON),
        (BOOK, RDF.type, READIT.medium),
        (HEAVY, RDF.type, READIT.resource_properties),
        (HEAVY, READIT.property_of, BOOK),
        (HEAVY, READIT.property_of, BLESSINGTON), # should be deleted
        (BALD, READIT.property_of, BOOK), # should be deleted
    ), ConjunctiveGraph)

    m = Migration()
    m.replace_property_of(graph_from_triples(()), conjunctive)

    assert len(list(conjunctive.quads((None, READIT.property_of, None)))) == 0
    assert len(list(conjunctive.quads((None, READIT.property_of_reader, None)))) == 1
    assert len(list(conjunctive.quads((None, READIT.property_of_resource, None)))) == 1


def test_replace_object_sparql():
    before = graph_from_triples(
        ((BLESSINGTON, RDF.type, READIT.reader),
         (BLESSINGTON, READIT.carries_out, READ_FRENCH_POEMS),
         (READ_FRENCH_POEMS, RDF.type, READIT.reading_session))
    )
    after = graph_from_triples(
        ((BLESSINGTON, RDF.type, READIT.person),
         (BLESSINGTON, READIT.carries_out, READ_FRENCH_POEMS),
         (READ_FRENCH_POEMS, RDF.type, READIT.reading_session))
    )

    assert len(before ^ after) == 2
    # replace_object_sparql(before, READIT.reader, READIT.person)
    replace_objects(READIT.reader, READIT.person, before)
    assert len(before ^ after) == 0


def test_insert_color():
    before = graph_from_triples(
        ((READIT.EXAMPLE, RDF.type, RDFS.Class),)
    )
    after = graph_from_triples(
        ((READIT.EXAMPLE, RDF.type, RDFS.Class),
         (READIT.EXAMPLE, SCHEMA.color, Literal("#009e74")))
    )

    assert len(before ^ after) == 1
    insert_color_triple(READIT.EXAMPLE, "#009e74", before)
    assert len(before ^ after) == 0
