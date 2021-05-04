from django.conf import settings
from items.graph import graph as item_graph
from rdf.migrations import RDFMigration, on_add, on_remove
from rdf.ns import *
from rdf.utils import (append_triples, graph_from_triples, prune_triples,
                       prune_triples_cascade)
from rdflib import Literal
from rdflib.namespace import Namespace

from . import namespace as READIT
from .fixture import canonical_graph
from .graph import graph

# Color palette
ORANGE = '#E69F00'
SKY_BLUE = '#56B4E9'
BLUISH_GREEN = '#009E73'
YELLOW = '#F0E442'
REDDISH_PURPLE = '#CC79A7'


CIDOC = Namespace('http://www.cidoc-crm.org/cidoc-crm/')
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

ADD_COLOR_UPDATE = '''
    INSERT {
        ?subject schema:color ?colorcode .
    }
    WHERE {
        ?subject ?p ?o .
    }
'''


def insert_color_triple(subject, colorcode, input_graph=None):
    context = input_graph if input_graph else graph()
    context.update(ADD_COLOR_UPDATE,
                   initBindings={
                       'subject': subject,
                       'colorcode': Literal(colorcode)
                   },
                   initNs={'schema': SCHEMA})


def replace_objects(before, after, graph=None):
    context = graph if graph else settings.RDFLIB_STORE
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
    desired = staticmethod(canonical_graph)

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

    # # # # # # # # # # # # # #
    # Skinny to REO migration #
    # # # # # # # # # # # # # #

    @on_add(READIT.E7)
    def add_E7(self, actual, conjunctive):
        """ Part of the migration from property-skinny to REO """
        replace_objects(READIT.act_of_reading, READIT.E7)
        replace_objects(READIT.reading_circumstances, READIT.E7)

    @on_add(READIT.F2)
    def add_F2(self, actual, conjunctive):
        """ Part of the migration from property-skinny to REO """
        replace_objects(READIT.content, READIT.F2)

    @on_add(READIT.REO41)
    def add_REO41(self, actual, conjunctive):
        """ Part of the migration from property-skinny to REO """
        replace_objects(READIT.medium, READIT.REO41)

    @on_add(READIT.E21)
    def add_E21(self, actual, conjunctive):
        """ Part of the migration from property-skinny to REO """
        replace_objects(READIT.reader, READIT.E21)
        replace_objects(READIT.reader_properties, READIT.E21)

    @on_add(READIT.REO14)
    def add_REO14(self, actual, conjunctive):
        """ Part of the migration from property-skinny to REO """
        replace_objects(READIT.resource_properties, READIT.REO14)

    @on_add(READIT.REO42)
    def add_REO42(self, actual, conjunctive):
        """ Part of the migration from property-skinny to REO """
        replace_objects(READIT.reading_response, READIT.REO42)





