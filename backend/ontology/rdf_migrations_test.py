from rdflib import ConjunctiveGraph, BNode, Literal
from ontology.conftest import annotation_triples

from rdf.ns import *
from rdf.utils import graph_from_triples
from . import namespace as READIT
from .rdf_migrations import *
from items import namespace as item
from vocab import namespace as vocab

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
        (HEAVY, READIT.property_of, BLESSINGTON),  # should be deleted
        (BALD, READIT.property_of, BOOK),  # should be deleted
    ), ConjunctiveGraph)

    m = Migration()
    m.replace_property_of(graph_from_triples(()), conjunctive)

    assert len(list(conjunctive.quads((None, READIT.property_of, None)))) == 0
    assert len(list(conjunctive.quads(
        (None, READIT.property_of_reader, None)))) == 1
    assert len(list(conjunctive.quads(
        (None, READIT.property_of_resource, None)))) == 1


def test_replace_object_sparql(object_triples):
    actual, desired = object_triples
    assert len(actual ^ desired) == 2
    replace_objects(READIT.reader, READIT.person, actual)
    assert len(actual ^ desired) == 0


def test_delete_items(linked_item_triples):
    actual, desired = linked_item_triples
    delete_linked_items(READIT.had_response, actual)
    assert len(actual ^ desired) == 1
    delete_linked_items(READIT.involved, actual)
    assert len(actual ^ desired) == 0


def test_needs_verification(annotation_triples):
    actual, desired = annotation_triples
    annotations_need_verification(READIT.reader, actual)
    assert len(actual ^ desired) == 0


def test_cidoc_property_inversion():
    before = graph_from_triples((
        (CIDOC.P100_was_death_of, RDFS.domain, ERLANGEN.E69_Death),
        (CIDOC.P100_was_death_of, RDFS.range, CIDOC.E21_Person),
        (CIDOC.P100i_died_in, RDFS.domain, CIDOC.E21_Person),
        (CIDOC.P100i_died_in, RDFS.range, ERLANGEN.E69_Death),
    ))
    after = graph_from_triples((
        (CIDOC.P100_was_death_of, RDFS.domain, ERLANGEN.E69_Death),
        (CIDOC.P100_was_death_of, RDFS.range, CIDOC.E21_Person),
        (CIDOC.P100i_died_in, RDFS.domain, CIDOC.E21_Person),
        (CIDOC.P100i_died_in, RDFS.range, ERLANGEN.E69_Death),
        (CIDOC.P100i_died_in, OWL.inverseOf, CIDOC.P100_was_death_of),
    ))
    invert_cidoc_property(CIDOC.P100_was_death_of, CIDOC.P100i_died_in, before)
    assert len(before ^ after) == 0
