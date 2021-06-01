from django.conf import settings
from rdflib.graph import Graph
from rdflib.term import URIRef
from items.graph import graph as item_graph
from ontology.constants import ONTOLOGY_NS
from rdf.migrations import RDFMigration, on_add, on_remove
from rdf.ns import (OA, CIDOC, RDF, RDFS, DCTERMS, SCHEMA, ERLANGEN, FRBROO, OWL)
from rdf.utils import (append_triples, graph_from_triples, prune_triples,
                       prune_triples_cascade)
from rdflib import Literal
from staff import namespace as staff
from vocab import namespace as vocab

from . import namespace as READIT
from .fixture import canonical_graph, reo_graph
from .graph import graph
import sys
import os.path as op

from rdf.management.commands.rdfmigrate import Command

# Color palette
ORANGE = '#E69F00'
SKY_BLUE = '#56B4E9'
BLUISH_GREEN = '#009E73'
YELLOW = '#F0E442'
REDDISH_PURPLE = '#CC79A7'
VERMILLION = '#D55E00'

# Mapping of CIDOC properties to their inversions
CIDOC_INVERSE_MAP = (
    (CIDOC.P100_was_death_of, CIDOC.P100i_died_in),
    (CIDOC.P102_has_title, CIDOC.P102i_is_title_of),
    (CIDOC.P128_carries, CIDOC.P128i_is_carried_by),
    (CIDOC.P129_is_about, CIDOC.P129i_is_subject_of),
    (CIDOC.P14_carried_out_by, CIDOC.P14i_performed),
    (CIDOC.P15_was_influenced_by, CIDOC.P15i_influenced),
    (CIDOC.P5_consists_of, CIDOC.P5i_forms_part_of),
    (CIDOC.P67_refers_to, CIDOC.P67i_is_referred_to_by),
    (CIDOC.P7_took_place_at, CIDOC.P7i_witnessed),
    (CIDOC.P78_is_identified_by, CIDOC.P78i_identifies),
    (CIDOC.P87_is_identified_by, CIDOC.P87i_identifies),
    (CIDOC.P98_brought_into_life, CIDOC.P98i_was_born),
    (URIRef('{}{}'.format(CIDOC, 'P4_has_time-span')),
     URIRef('{}{}'.format(CIDOC, 'P4i_is_time-span_of'))),
)

DELETE_CLASS_ANNOS_UPDATE = '''
DELETE {
    ?annotation ?a ?b.
    ?target ?c ?d.
    ?selector ?e ?f.
} WHERE {
    ?annotation a oa:Annotation;
                oa:hasBody ?body;
                oa:hasTarget ?target;
                ?a ?b.
    ?target oa:hasSelector ?selector;
            ?c ?d.
    ?selector ?e ?f.
}
'''

REPLACE_OBJECT_UPDATE = '''
    DELETE {
        ?s ?p ?before .
    }
    INSERT {
        ?s ?p ?after .
    }
    WHERE {
        ?s ?p ?before .
    }
'''

COLOR_SUPERCLASS_UPDATE = '''
INSERT {
    ?superclass schema:color ?colorcode .
    ?subclass schema:color ?colorcode .
}
WHERE {
    OPTIONAL{ ?subclass ?prefclass ?superclass . }
    ?superclass ?p ?o .
}
'''

DELETE_LINKED_ITEMS_UPDATE = '''
DELETE {
        ?s ?prop ?target .
    }
WHERE {
  { ?s ?prop ?target .
    ?target dcterms:type "example data" ;
    ?p ?o .
  }
  UNION
  { ?s ?prop ?target .
    ?target dcterms:creator ?dhdevelopers ;
    ?p ?o .
  }
}
'''

ANNO_NEEDS_VERIFICATION_UPDATE = '''
INSERT {
    ?anno ?needs_veri true
}
WHERE {
    ?anno a oa:Annotation ;
    oa:hasBody ?class .
}
'''


def add_reo_superclass(superclass, replaces, subclasses, colorcode):
    """ Add a REO superclass to the ontology:
        - Replaces object in annotations of this annotation
        - Sets the superclass as preffered for relevant subclasses
        - Assigns color to superclass and relevant subclasses
        - Annotations of the new class need verification
    """
    for rep in replaces:
        replace_objects(rep, superclass)
    for subclass in subclasses:
        set_pref_superclass(subclass, superclass)
    set_superclass_color(superclass, colorcode)
    annotations_need_verification(superclass)


def reset_ontology():
    # For testing purposes only
    settings.RDFLIB_STORE.update('CLEAR GRAPH <{}>'.format(ONTOLOGY_NS))
    assert len(graph()) == 0
    c = Command(stdout=sys.stdout)
    m = Migration()
    m.desired = canonical_graph
    c.migrate_graph(m)


def invert_cidoc_property(direct, inverse, input_graph=None):
    context = input_graph if input_graph else graph()
    query = 'INSERT DATA {{ <{}> <{}> <{}> }}'.format(
        inverse, OWL.inverseOf, direct)
    context.update(query)


def set_pref_superclass(subclass, superclass, input_graph=None):
    # For a mysterious reason, this fails when using initBindings
    context = input_graph if input_graph else graph()
    query = 'INSERT DATA {{ <{}> <{}> <{}> }}'.format(
        subclass, vocab.hasPrefSuperClass, superclass)
    context.update(query)


def set_superclass_color(superclass, colorcode, input_graph=None):
    context = input_graph if input_graph else graph()
    bindings = {'superclass': superclass, 'colorcode': Literal(
        colorcode), 'prefclass': vocab.hasPrefSuperClass}
    namespaces = {'schema': SCHEMA}
    context.update(COLOR_SUPERCLASS_UPDATE,
                   initBindings=bindings, initNs=namespaces)


def annotations_need_verification(anno_class, input_graph=None):
    context = input_graph if input_graph else item_graph()
    bindings = {'class': anno_class, 'needs_veri': vocab.needsVerification}
    namespaces = {'oa': OA}
    context.update(ANNO_NEEDS_VERIFICATION_UPDATE,
                   initBindings=bindings, initNs=namespaces)


def delete_linked_items(property, input_graph=None):
    """ Delete any triples with predicate 'property'.
    Only if the target is either example data or
    created by the developers (assumed example data).
    """
    context = input_graph if input_graph else item_graph()
    bindings = {'prop': property, 'dhdevelopers': staff.dhdevelopers}
    namespaces = {'dcterms': DCTERMS}
    context.update(DELETE_LINKED_ITEMS_UPDATE,
                   initBindings=bindings, initNs=namespaces)


def assign_color(subject, colorcode, input_graph=None):
    context = input_graph if input_graph else graph()
    query = 'INSERT DATA {{ <{}> <{}> "{}" }}'.format(
        subject, SCHEMA.color, colorcode)
    context.update(query)


def replace_objects(before, after, input_graph=None):
    context = input_graph if input_graph else item_graph()
    context.update(REPLACE_OBJECT_UPDATE, initBindings={
        'before': before,
        'after': after
    })


def replace_object(graph, before, after):
    """
    Replace all triples with `before` as object by one with `after`.
    """
    obsolete = list(graph.quads((None, None, before)))
    prune_triples(graph, obsolete)
    replacements = ((s, p, after, c) for (s, p, o, c) in obsolete)
    append_triples(graph, replacements)


def replace_predicate(graph, before, before_rev, after):
    """
    Replace all triples with `before` as predicate by one with `after`.

    Optionally also deletes old triples with the reverse predicate
    `before_rev`.
    """
    obsolete = list(graph.quads((None, before, None)))
    prune_triples(graph, obsolete)
    if before_rev:
        prune_triples(graph, graph.quads((None, before_rev, None)))
    replacements = ((s, after, o, c) for (s, p, o, c) in obsolete)
    append_triples(graph, replacements)


def replace_predicate_by_pattern(graph, pattern, pattern_rev, after):
    """
    Find all triples by `pattern`, and replace predicate by `after`.

    Optionally also deletes old triples with `pattern_rev` (i.e. with a rev predicate).
    """
    obsolete = list(graph.quads(pattern))
    prune_triples(graph, obsolete)
    if pattern_rev:
        prune_triples(graph, graph.quads(pattern_rev))
    replacements = ((s, after, o, c) for (s, p, o, c) in obsolete)
    append_triples(graph, replacements)


def delete_cascade(graph, predicate, _object):
    """
    Delete all triples in the item graph with the combination of `predicate` and `_object`.
    """
    obsolete = list(graph.quads((None, predicate, _object)))
    prune_triples_cascade(graph, obsolete, [item_graph()], [OA.hasBody])


def delete_predicate(graph, predicate):
    """ Remove all occurrences of `predicate` from `graph`. """
    prune_triples(graph, graph.quads((None, predicate, None)))


def delete_subjects(graph, pattern):
    """ Delete all subjects in `graph` with a triple matching `pattern`. """
    if pattern == (None, None, None):
        raise ValueError('Why don\'t you just drop your database?')
    matching = graph_from_triples(graph.triples(pattern))
    subjects = set(matching.subjects())
    for s in subjects:
        prune_triples(graph, graph.triples((s, None, None)))


def is_type(graph, subject, _type):
    '''
    Check whether `subject` is known as `_type` in graph
    '''
    return len(list(graph.quads((subject, RDF.type, _type)))) > 0


class Migration(RDFMigration):
    actual = staticmethod(graph)
    desired = staticmethod(reo_graph)

    @on_add(READIT.carried_out)
    def replace_CIDOC_carries_out(self, actual, conjunctive):
        """ Part of the migration from class-only skinny to property-skinny. """
        before = CIDOC.carries_out
        before_rev = CIDOC.carried_out_by
        after = READIT.carried_out
        replace_predicate(conjunctive, before, before_rev, after)

    @on_add(READIT.had_outcome)
    def replace_READIT_is_outcome_of(self, actual, conjunctive):
        """ Part of the migration from class-only skinny to property-skinny. """
        before = READIT.has_outcome
        before_rev = READIT.is_outcome_of
        after = READIT.had_outcome
        replace_predicate(conjunctive, before, before_rev, after)

    @on_add(READIT.influenced)
    def replace_CIDOC_influenced(self, actual, conjunctive):
        """ Part of the migration from class-only skinny to property-skinny. """
        before = CIDOC.influenced
        before_rev = CIDOC.was_influenced_by
        after = READIT.influenced
        replace_predicate(conjunctive, before, before_rev, after)

    @on_remove(READIT.state_of_mind)
    def replace_READIT_state_of_mind(self, actual, conjunctive):
        before = READIT.state_of_mind
        after = READIT.reading_response
        replace_object(conjunctive, before, after)
        replace_predicate(conjunctive, READIT.had_state,
                          None, READIT.had_response)

    @on_remove(READIT.reading_session)
    def delete_READIT_reading_session(self, actual, conjunctive):
        _object = READIT.reading_session
        delete_cascade(conjunctive, OA.hasBody, _object)
        delete_subjects(conjunctive, (None, RDF.type, _object))
        delete_predicate(conjunctive, READIT.carried_out)
        delete_predicate(conjunctive, READIT.influenced)

    @on_remove(READIT.property_of)
    def replace_property_of(self, actual, conjunctive):
        before = READIT.property_of
        before_rev = READIT.had_property
        after_resource = READIT.property_of_resource
        after_reader = READIT.property_of_reader

        obsolete = list(conjunctive.quads((None, before, None)))

        for (s, p, o, c) in obsolete:
            object_is_reader = is_type(conjunctive, o, READIT.reader)

            if is_type(conjunctive, s, READIT.resource_properties) and not object_is_reader:
                conjunctive.add((s, after_resource, o, c))

            if is_type(conjunctive, s, READIT.reader_properties) and object_is_reader:
                conjunctive.add((s, after_reader, o, c))

            conjunctive.remove((s, p, o, c))

        delete_predicate(conjunctive, before_rev)

    @on_remove(READIT.reading_testimony)
    def delete_READIT_reading_testimony(self, actual, conjunctive):
        item_graph().update(
            DELETE_CLASS_ANNOS_UPDATE,
            initNs={'oa': OA},
            initBindings={'body': READIT.reading_testimony},
        )

    # # # # # # # # # # # # # # # #
    # Skinny to REO migration     #
    # Superclasses #
    # # # # # # # # # # # # # # # #
    @on_add(CIDOC.E21_Person)
    def add_E21(self, actual, conjunctive):
        replaces = (READIT.reader, READIT.reader_properties)
        preffered_by = (
            READIT.REO5, ERLANGEN.E67_Birth, ERLANGEN.E69_Death, READIT.REO35,
            READIT.REO10, READIT.REO36, READIT.REO37, READIT.REO38,
            READIT.REO11, READIT.REO39, READIT.REO19, READIT.REO2,
            READIT.REO15, URIRef('{}{}'.format(
                READIT, 'REO43_Appellation_(temporal_entity)')),
        )
        add_reo_superclass(CIDOC.E21_Person, replaces,
                           preffered_by, BLUISH_GREEN)

    @on_add(CIDOC.E7_Activity)
    def add_E7(self, actual, conjunctive):
        replaces = (READIT.act_of_reading, READIT.reading_circumstances)
        preffered_by = (
            CIDOC.E53_Place, CIDOC.E50_Date, READIT.REO3, READIT.REO9,
            READIT.REO8, READIT.REO13, READIT.REO18, READIT.REO17,
            READIT.REO7, READIT.REO4
        )
        add_reo_superclass(CIDOC.E7_Activity, replaces, preffered_by, ORANGE)

    @on_add(FRBROO.F2)
    def add_F2(self, actual, conjunctive):
        """ F2 Expression """
        replaces = (READIT.content, )
        preffered_by = (
            ERLANGEN.E35_Title, CIDOC.E39_Actor, READIT.REO6, READIT.REO16,
            READIT.REO41, READIT.REO40, CIDOC.E56_Language, READIT.REO14
        )
        add_reo_superclass(FRBROO.F2, replaces, preffered_by, SKY_BLUE)

    @on_add(READIT.REO23)
    def add_REO23(self, actual, conjunctive):
        """ REO23 Effects (internal processes) """
        replaces = []  # replaces in REO42
        preffered_by = (
            READIT.REO27, READIT.REO20, READIT.REO21,
            READIT.REO28, READIT.REO29, READIT.REO30
        )
        add_reo_superclass(READIT.REO23, replaces,
                           preffered_by, REDDISH_PURPLE)

    @on_add(READIT.REO12)
    def add_REO12(self, actual, conjunctive):
        """ REO12 Outcomes (external processes) """
        replaces = []  # replaces in REO42
        preffered_by = (
            READIT.REO22, READIT.REO26, READIT.REO31,
            READIT.REO32, READIT.REO33
        )
        add_reo_superclass(READIT.REO12, replaces, preffered_by, YELLOW)

    # # # # # # # # # # # # # # #
    # Skinny to REO migration #
    # Other classses         #
    # # # # # # # # # # # # # # #

    @on_add(READIT.REO42)
    def add_REO42(self, actual, conjunctive):
        """ REO42 Effects/Outcomes (deprecated)
        Serves as temporary container for annotations of REO12 and REO23 """
        replace_objects(READIT.reading_response, READIT.REO42)
        annotations_need_verification(READIT.REO42)
        assign_color(READIT.REO42, REDDISH_PURPLE)

    @on_add(READIT.REO41)
    def add_REO41(self, actual, conjunctive):
        """ REO41 Medium """
        replace_objects(READIT.medium, READIT.REO41)

    @on_add(READIT.REO14)
    def add_REO14(self, actual, conjunctive):
        """ REO14 Provenance """
        replace_objects(READIT.resource_properties, READIT.REO14)

    # # # # # # # # # # # # # # #
    # Skinny to REO migration   #
    # Misc      #
    # # # # # # # # # # # # # # #

    @on_remove(READIT.outcome_of)
    def remove_skinny_items(self, actual, conjunctive):
        skinny_source = op.join(
            settings.BASE_DIR, 'ontology', 'mock-ontology.jsonld')
        skinny_graph = Graph().parse(skinny_source, format='json-ld')
        skinny_properties = skinny_graph.subjects(RDF.type, RDF.Property)
        for prop in skinny_properties:
            delete_linked_items(prop)

    @ on_add(CIDOC.P100_was_death_of)
    def cidoc_property_inversions(self, actual, conjunctive):
        """ CIDOC properties miss explicit inverse relations,
        manually add these. """
        for (direct, inverted) in CIDOC_INVERSE_MAP:
            invert_cidoc_property(direct, inverted)
