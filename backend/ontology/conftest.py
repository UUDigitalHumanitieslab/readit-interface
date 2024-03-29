import pytest
from items import namespace as item
from rdf.ns import DCTERMS, OA, RDF, RDFS, SCHEMA, SKOS, XSD
from rdf.utils import graph_from_triples
from rdflib import BNode, Literal
from staff import namespace as staff
from vocab import namespace as vocab

from . import namespace as READIT

BLESSINGTON = BNode()
READ_FRENCH_POEMS = BNode()


@pytest.fixture
def linked_item_triples():
    return (
        graph_from_triples((
            (item.subject1, RDF.type, READIT.reader),
            (item.subject1, READIT.had_response, item.subject2),
            (item.subject1, READIT.had_response, item.subject3),
            (item.subject1, READIT.had_response, item.subject5),

            (item.subject2, RDF.type, READIT.reading_response),
            (item.subject2, RDFS.label, Literal("remember")),
            (item.subject2, DCTERMS.type, Literal("example data")),

            (item.subject3, RDF.type, READIT.reading_response),
            (item.subject3, SKOS.prefLabel, Literal("Comment on book")),
            (item.subject3, DCTERMS.creator, staff.dhdevelopers),
            (item.subject3, READIT.involved, item.subject4),

            (item.subject4, RDF.type, READIT.content),
            (item.subject4, SKOS.prefLabel, Literal("Title of book")),
            (item.subject4, DCTERMS.creator, staff.dhdevelopers),

            (item.subject5, RDF.type, READIT.reading_response),
            (item.subject5, RDFS.label, Literal("thought about")),
        )),
        graph_from_triples((
            (item.subject1, RDF.type, READIT.reader),
            (item.subject1, READIT.had_response, item.subject5),

            (item.subject2, RDF.type, READIT.reading_response),
            (item.subject2, RDFS.label, Literal("remember")),
            (item.subject2, DCTERMS.type, Literal("example data")),

            (item.subject3, RDF.type, READIT.reading_response),
            (item.subject3, SKOS.prefLabel, Literal("Comment on book")),
            (item.subject3, DCTERMS.creator, staff.dhdevelopers),

            (item.subject4, RDF.type, READIT.content),
            (item.subject4, SKOS.prefLabel, Literal("Title of book")),
            (item.subject4, DCTERMS.creator, staff.dhdevelopers),

            (item.subject5, RDF.type, READIT.reading_response),
            (item.subject5, RDFS.label, Literal("thought about")),
        ))
    )


@pytest.fixture
def color_triples():
    return (
        graph_from_triples(
            ((READIT.EXAMPLE, RDF.type, RDFS.Class),
             (READIT.EXAMPLE_CHILD, RDF.type, RDFS.Class),
                (READIT.EXAMPLE_CHILD, RDFS.subClassOf, READIT.EXAMPLE))
        ),
        graph_from_triples(
            ((READIT.EXAMPLE, RDF.type, RDFS.Class),
             (READIT.EXAMPLE, SCHEMA.color, Literal("#009e74")),
                (READIT.EXAMPLE_CHILD, RDF.type, RDFS.Class),
                (READIT.EXAMPLE_CHILD, RDFS.subClassOf, READIT.EXAMPLE),
                (READIT.EXAMPLE_CHILD, SCHEMA.color, Literal("#009e74"))
             )
        )
    )


@pytest.fixture
def object_triples():
    return (
        graph_from_triples((
            (BLESSINGTON, RDF.type, READIT.reader),
            (BLESSINGTON, READIT.carries_out, READ_FRENCH_POEMS),
            (READ_FRENCH_POEMS, RDF.type, READIT.reading_session)
        )),
        graph_from_triples((
            (BLESSINGTON, RDF.type, READIT.person),
            (BLESSINGTON, READIT.carries_out, READ_FRENCH_POEMS),
            (READ_FRENCH_POEMS, RDF.type, READIT.reading_session)
        ))
    )


@pytest.fixture
def annotation_triples():
    return (
        graph_from_triples((
            (item.subject1, RDF.type, OA.Annotation),
            (item.subject1, OA.hasBody, READIT.reader),
            (item.subject2, RDF.type, OA.Annotation),
            (item.subject2, OA.hasBody, READIT.otherClass)
        )),
        graph_from_triples((
            (item.subject1, RDF.type, OA.Annotation),
            (item.subject1, OA.hasBody, READIT.reader),
            (item.subject1, vocab.needsVerification,
             Literal("true", datatype=XSD.boolean)),
            (item.subject2, RDF.type, OA.Annotation),
            (item.subject2, OA.hasBody, READIT.otherClass)
        ))
    )
