from django.conf import settings
from items.graph import graph as item_graph
from rdf.migrations import RDFMigration, on_add, on_remove
from rdf.ns import *
from rdf.utils import (append_triples, graph_from_triples, prune_triples,
                       prune_triples_cascade)
from rdflib import Literal
from rdflib.namespace import Namespace
from staff import namespace as staff
from vocab import namespace as vocab

from . import namespace as READIT
from .fixture import canonical_graph, reo_graph
from .graph import graph

# Color palette
ORANGE = '#E69F00'
SKY_BLUE = '#56B4E9'
BLUISH_GREEN = '#009E73'
YELLOW = '#F0E442'
REDDISH_PURPLE = '#CC79A7'
VERMILLION = '#D55E00'


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

SKINNY_REO_CLASS_MAPPING = {
    READIT.act_of_reading: READIT.E7,
    READIT.content: READIT.F2,
    READIT.medium: READIT.REO41,
    READIT.reader: READIT.E21,
    READIT.reader_properties: READIT.E21,
    READIT.reading_circumstances: READIT.E7,
    READIT.reading_response: READIT.REO42,
    READIT.resource_properties: READIT.REO14,
}

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

ASSIGN_COLOR_UPDATE = '''
    INSERT {
        ?subject schema:color ?colorcode .
        ?child   schema:color ?colorcode .
    }
    WHERE {
       { ?subject ?p ?o . }
       UNION
       { ?child rdfs:subClassOf ?subject }
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
    bindings = {'subject': subject, 'colorcode': Literal(colorcode)}
    namespaces = {'schema': SCHEMA, 'rdfs': RDFS}

    context.update(ASSIGN_COLOR_UPDATE,
                   initBindings=bindings,
                   initNs=namespaces)


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
    # Map classes & assign colors #
    # # # # # # # # # # # # # # # #

    @on_add(CIDOC.E7)
    def add_E7(self, actual, conjunctive):
        """ E7 Activity
        Part of the migration from property-skinny to REO """
        replace_objects(READIT.act_of_reading, CIDOC.E7)
        replace_objects(READIT.reading_circumstances, CIDOC.E7)
        assign_color(CIDOC.E7, ORANGE)
        annotations_need_verification(CIDOC.E7)

    @on_add(FRBROO.F2)
    def add_F2(self, actual, conjunctive):
        """ F2 Expression
        Part of the migration from property-skinny to REO """
        replace_objects(READIT.content, FRBROO.F2)
        assign_color(FRBROO.F2, SKY_BLUE)
        annotations_need_verification(FRBROO.F2)

    @on_add(READIT.REO41)
    def add_REO41(self, actual, conjunctive):
        """ REO41 Medium
        Part of the migration from property-skinny to REO """
        replace_objects(READIT.medium, READIT.REO41)

    @on_add(CIDOC.E21)
    def add_E21(self, actual, conjunctive):
        """ E21 Person
        Part of the migration from property-skinny to REO """
        replace_objects(READIT.reader, CIDOC.E21)
        replace_objects(READIT.reader_properties, CIDOC.E21)
        assign_color(CIDOC.E21, BLUISH_GREEN)
        annotations_need_verification(CIDOC.E21)

    @on_add(READIT.REO14)
    def add_REO14(self, actual, conjunctive):
        """ REO14 Provenance
        Part of the migration from property-skinny to REO """
        replace_objects(READIT.resource_properties, READIT.REO14)

    @on_add(READIT.REO42)
    def add_REO42(self, actual, conjunctive):
        """ REO42 Effects/Outcomes (deprecated)
        Serves as temporary container for annotations of REO12 and REO23
        Part of the migration from property-skinny to REO """
        replace_objects(READIT.reading_response, READIT.REO42)
        assign_color(READIT.REO42, VERMILLION)
        assign_color(READIT.REO12, YELLOW)
        assign_color(READIT.REO23, REDDISH_PURPLE)
        annotations_need_verification(READIT.REO42)

    # # # # # # # # # # # # # #
    # Skinny to REO migration #
    # Remove linked items     #
    # # # # # # # # # # # # # #

    @on_remove(READIT.outcome_of)
    def remove_outcome_of(self, actual, conjunctive):
        delete_linked_items(READIT.outcome_of)

    @on_remove(READIT.involved)
    def remove_involved(self, actual, conjunctive):
        delete_linked_items(READIT.involved)

    @on_remove(READIT.influenced)
    def remove_influenced(self, actual, conjunctive):
        delete_linked_items(READIT.influenced)

    @on_remove(READIT.had_reader_property)
    def remove_had_reader_property(self, actual, conjunctive):
        delete_linked_items(READIT.had_reader_property)

    @on_remove(READIT.had_response)
    def remove_had_response(self, actual, conjunctive):
        delete_linked_items(READIT.had_response)

    @on_remove(READIT.property_of_reader)
    def remove_property_of_reader(self, actual, conjunctive):
        delete_linked_items(READIT.property_of_reader)

    @on_remove(READIT.enabled_to_read)
    def remove_enabled_to_read(self, actual, conjunctive):
        delete_linked_items(READIT.enabled_to_read)

    @on_remove(READIT.carried_out)
    def remove_carried_out(self, actual, conjunctive):
        delete_linked_items(READIT.carried_out)

    @on_remove(READIT.had_resource_property)
    def remove_had_resource_property(self, actual, conjunctive):
        delete_linked_items(READIT.had_resource_property)

    @on_remove(READIT.provided_access_to)
    def remove_provided_access_to(self, actual, conjunctive):
        delete_linked_items(READIT.provided_access_to)

    @on_remove(READIT.provided_access_by)
    def remove_provided_access_by(self, actual, conjunctive):
        delete_linked_items(READIT.provided_access_by)

    @on_remove(READIT.carried_out_by)
    def remove_carried_out_by(self, actual, conjunctive):
        delete_linked_items(READIT.carried_out_by)

    @on_remove(READIT.read_by)
    def remove_read_by(self, actual, conjunctive):
        delete_linked_items(READIT.read_by)

    @on_remove(READIT.involved_in)
    def remove_involved_in(self, actual, conjunctive):
        delete_linked_items(READIT.involved_in)

    @on_remove(READIT.influenced_by)
    def remove_influenced_by(self, actual, conjunctive):
        delete_linked_items(READIT.influenced_by)

    @on_remove(READIT.had_outcome)
    def remove_had_outcome(self, actual, conjunctive):
        delete_linked_items(READIT.had_outcome)

    @on_remove(READIT.response_of)
    def remove_response_of(self, actual, conjunctive):
        delete_linked_items(READIT.response_of)

    @on_remove(READIT.read_through)
    def remove_read_through(self, actual, conjunctive):
        delete_linked_items(READIT.read_through)

    @on_remove(READIT.property_of_resource)
    def remove_property_of_resource(self, actual, conjunctive):
        delete_linked_items(READIT.property_of_resource)

    @on_remove(READIT.read)
    def remove_read(self, actual, conjunctive):
        delete_linked_items(READIT.read)
