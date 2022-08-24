from .rdf_migrations import Migration
from rdf.utils import graph_from_triples
from sources.graph import graph as sources_graph


def test_source_ontology_migrations(old_sources, new_sources):

    g = graph_from_triples(old_sources)

    s = sources_graph()
    s.remove((None, None, None))
    assert len(s) == 0
    s += g

    m = Migration()

    m.source_ontology_additions(None, None)
    m.source_ontology_changes(None, None)
    m.source_ontology_types(None, None)

    exp_g = graph_from_triples(new_sources)

    from pprint import pprint
    pprint(list(s ^ exp_g))

    assert len(s ^ exp_g) == 0
