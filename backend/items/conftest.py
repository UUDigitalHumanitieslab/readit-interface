from datetime import datetime, date

import pytest

from rdflib import Graph, Literal, URIRef

from rdf.ns import *
from vocab import namespace as VOCAB
from sources import namespace as SOURCE
from staff import namespace as STAFF
from ontology import namespace as ONTO
from . import namespace as ITEM
from .graph import graph

CREATION_DATE = Literal(datetime.now())

TRIPLES = (
    ( ITEM['1'], RDF.type,              OA.TextQuoteSelector               ),
    ( ITEM['1'], OA.prefix,             Literal('this is the start of ')   ),
    ( ITEM['1'], OA.exact,              Literal('the exact selection')     ),
    ( ITEM['1'], OA.suffix,             Literal(' and this is the end')    ),
    ( ITEM['1'], DCTERMS.creator,       STAFF.AHebing                      ),
    ( ITEM['1'], DCTERMS.created,       CREATION_DATE                      ),

    ( ITEM['2'], RDF.type,              OA.XPathSelector                   ),
    ( ITEM['2'], RDF.value,             Literal('substring(.//*[0]/text(), 22)') ),
    ( ITEM['2'], DCTERMS.creator,       STAFF.AHebing                      ),
    ( ITEM['2'], DCTERMS.created,       CREATION_DATE                      ),

    ( ITEM['3'], RDF.type,              OA.XPathSelector                   ),
    ( ITEM['3'], RDF.value,             Literal('substring(.//*[0]/text(), 41)') ),
    ( ITEM['3'], DCTERMS.creator,       STAFF.AHebing                      ),
    ( ITEM['3'], DCTERMS.created,       CREATION_DATE                      ),

    ( ITEM['4'], RDF.type,              VOCAB.RangeSelector                ),
    ( ITEM['4'], OA.hasStartSelector,   ITEM['2']                          ),
    ( ITEM['4'], OA.hasEndSelector,     ITEM['3']                          ),
    ( ITEM['4'], DCTERMS.creator,       STAFF.AHebing                      ),
    ( ITEM['4'], DCTERMS.created,       CREATION_DATE                      ),

    ( ITEM['5'], RDF.type,              OA.SpecificResource                ),
    ( ITEM['5'], OA.hasSource,          SOURCE['1']                        ),
    ( ITEM['5'], OA.hasSelector,        ITEM['4']                          ),
    ( ITEM['5'], OA.hasSelector,        ITEM['1']                          ),
    ( ITEM['5'], DCTERMS.creator,       STAFF.AHebing                      ),
    ( ITEM['5'], DCTERMS.created,       CREATION_DATE                      ),

    ( ITEM['6'], RDF.type,              ONTO.reader                        ),
    ( ITEM['6'], SKOS.prefLabel,        Literal('Margaret Blessington')    ),
    ( ITEM['6'], ONTO.is_identified_by, Literal('Margaret Gardiner Blessington') ),
    ( ITEM['6'], ONTO.is_identified_by, Literal('Marguerite Gardiner, countess of Blessington') ),
    ( ITEM['6'], ONTO.has_gender,       Literal('female')                  ),
    ( ITEM['6'], ONTO.has_occupation,   Literal('novelist')                ),
    ( ITEM['6'], ONTO.has_occupation,   Literal('writer')                  ),
    ( ITEM['6'], ONTO.has_nationality,  Literal('Irish')                   ),
    ( ITEM['6'], CIDOC.was_born,        Literal(date(1789, 9, 1))          ),
    ( ITEM['6'], CIDOC.died,            Literal(date(1849, 6, 4))          ),
    ( ITEM['6'], OWL.sameAs,            URIRef('https://en.wikipedia.org/wiki/Marguerite_Gardiner,_Countess_of_Blessington') ),
    ( ITEM['6'], DCTERMS.type,          Literal('example data')            ),
    ( ITEM['6'], DCTERMS.creator,       STAFF.AHebing                      ),
    ( ITEM['6'], DCTERMS.created,       CREATION_DATE                      ),

    ( ITEM['7'], RDF.type,              OA.Annotation                      ),
    ( ITEM['7'], OA.hasBody,            ONTO.reader                        ),
    ( ITEM['7'], OA.hasBody,            ITEM['6']                          ),
    ( ITEM['7'], OA.hasTarget,          ITEM['5']                          ),
    ( ITEM['7'], OA.motivatedBy,        OA.tagging                         ),
    ( ITEM['7'], OA.motivatedBy,        OA.identifying                     ),
    ( ITEM['7'], DCTERMS.creator,       STAFF.AHebing                      ),
    ( ITEM['7'], DCTERMS.created,       CREATION_DATE                      ),
)


@pytest.fixture
def itemgraph():
    g = Graph()
    for t in TRIPLES:
        g.add(t)
    return g


@pytest.fixture
def itemgraph_db(db, itemgraph):
    g = graph()
    g += itemgraph
    yield
    g -= itemgraph
