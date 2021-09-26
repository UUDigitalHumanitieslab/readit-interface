import pytest
from rdf.ns import DCTERMS, ISO6391, RDF, XSD, SCHEMA
from rdf.utils import graph_from_triples
from rdflib import Literal
from sources import namespace as SOURCE
from vocab import namespace as VOCAB
from staff import namespace as STAFF

from . import namespace as SRCONT


@pytest.fixture
def old_sources():
    return graph_from_triples((
        (SOURCE['1'], RDF.type, VOCAB.Source),
        (SOURCE['1'], RDF.type, SCHEMA.Book),
        (SOURCE['1'], DCTERMS.created, Literal(
            "2021-09-26T17:52", datatype=XSD.dateTime)),
        (SOURCE['1'], DCTERMS.creator, Literal(
            "2021-09-26T17:52", datatype=XSD.dateTime)),
        (SOURCE['1'], DCTERMS.created, STAFF.JaneDoe),
        (SOURCE['1'], SCHEMA.author, Literal(
            "Blessington, Margaret Gardiner")),
        (SOURCE['1'], SCHEMA.datePublished, Literal(
            "1841-01-01", datatype=XSD.date)),
        (SOURCE['1'], SCHEMA.inLanguage, ISO6391.en),
        (SOURCE['1'], SCHEMA.name, Literal("The Idler in France"))
    ))


@pytest.fixture
def new_sources():
    return graph_from_triples((
        (SOURCE['1'], RDF.type, VOCAB.Source),
        (SOURCE['1'], RDF.type, SCHEMA.Book),
        (SOURCE['1'], DCTERMS.created, Literal(
            "2021-09-26T17:52", datatype=XSD.dateTime)),
        (SOURCE['1'], DCTERMS.creator, Literal(
            "2021-09-26T17:52", datatype=XSD.dateTime)),
        (SOURCE['1'], DCTERMS.created, STAFF.JaneDoe),
        (SOURCE['1'], SCHEMA.author, Literal(
            "Blessington, Margaret Gardiner")),
        (SOURCE['1'], SCHEMA.datePublished, Literal(
            "1841-01-01", datatype=XSD.date)),
        (SOURCE['1'], SCHEMA.inLanguage, ISO6391.en),
        (SOURCE['1'], SCHEMA.name, Literal("The Idler in France"))
    ))
