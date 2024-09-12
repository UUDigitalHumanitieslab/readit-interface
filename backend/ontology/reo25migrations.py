from rdf.ns import RDFS, RDF, OWL, FRBROO, SKOS, CIDOC, SCHEMA
from . import namespace as READIT
from .rdf_migrations import SKY_BLUE
from rdflib import Literal
from rdf.utils import append_triples, prune_triples


def REO44():
    subj = READIT.REO44
    return [
        (subj, RDF.type, OWL.Class),
        (subj, RDFS.label, Literal('REO44 RA vocabularies', lang='en')),
        (subj, RDFS.comment, Literal('This class comprises concepts denoted by terms from existing thesauri and controlled vocabularies used to characterize and classify the content of the F2 Expression.', lang='en')),
        (subj, RDFS.subClassOf, CIDOC.E55_Type),
        (subj, SKOS.notation,  Literal('REO44')),
        (subj, SKOS.prefLabel,  Literal('Story element', lang='en')),
        (subj, SKOS.related, FRBROO.F2),
        (subj, SCHEMA.color, Literal(SKY_BLUE))
    ]


def REO45():
    subj = READIT.REO45
    return [
        (subj, RDF.type, OWL.Class),
        (subj, RDFS.label, Literal('REO45 Discovery', lang='en')),
        (subj, RDFS.comment, Literal('This class comprises concepts denoted by terms not included in existing thesauri or controlled vocabularies used to characterize and classify the content of the F2 Expression.', lang='en')),
        (subj, RDFS.subClassOf, CIDOC.E55_Type),
        (subj, SKOS.notation,  Literal('REO45')),
        (subj, SKOS.prefLabel,  Literal('Discovery', lang='en')),
        (subj, SKOS.related, FRBROO.F2),
        (subj, SCHEMA.color, Literal(SKY_BLUE))
    ]


def p30():
    subj = READIT.readP30
    return [
        (subj, RDF.type, OWL.ObjectProperty),
        (subj, RDFS.label, Literal(
            'readP30 has story element', lang='en')),
        (subj, RDFS.domain, FRBROO.F2),
        (subj, RDFS.range, READIT.REO44),
        (subj, RDFS.range, READIT.REO45),
        (subj, SKOS.notation,  Literal('readP30i')),
        (subj, SKOS.prefLabel,  Literal('is story element of', lang='en')),
    ]


def p30i():
    subj = READIT.is_story_element_of
    return [
        (subj, RDF.type, OWL.ObjectProperty),
        (subj, RDFS.label, Literal(
            'readP30i is story element of', lang='en')),
        (subj, RDFS.domain, FRBROO.F2),
        (subj, RDFS.range, READIT.REO44),
        (subj, RDFS.range, READIT.REO45),
        (subj, SKOS.notation,  Literal('readP30')),
        (subj, SKOS.prefLabel,  Literal('has story element', lang='en')),
        (subj, OWL.inverseOf, READIT.readP30),
    ]


def upgrade_to_reo25(graph):
    triples = REO44() + REO45() + p30() + p30i()
    append_triples(graph, triples)


def downgrade_from_reo25(graph):
    triples = REO44() + REO45() + p30() + p30i()
    prune_triples(graph, triples)
