from rdflib.namespace import Namespace

from . import namespace as READIT
from .graph import graph
from .fixture import canonical_graph
from rdf.migrations import *
from rdf.utils import append_triples, prune_triples, prune_triples_cascade
from rdf.ns import *
from items.graph import graph as item_graph

CIDOC = Namespace('http://www.cidoc-crm.org/cidoc-crm/')


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


def delete(graph, predicate, _object):
    """
    Delete all triples in the item graph with the combination of `predicate` and `_object`.
    """
    obsolete = list(graph.quads((None, predicate, _object)))
    prune_triples_cascade(graph, obsolete, [item_graph], [OA.hasBody])


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

    @on_remove(READIT.reading_session)
    def delete_READIT_reading_session(self, actual, conjunctive):
        _object = READIT.reading_session
        delete(conjunctive, OA.hasBody, _object)
        delete(conjunctive, RDF.type, _object)
