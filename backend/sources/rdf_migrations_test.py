import pytest
from rdf.utils import graph_from_triples
from rdflib import ConjunctiveGraph

from .graph import graph
from .rdf_migrations import Migration


@pytest.mark.usefixtures("sparql_client")
def test_author_creator(sourcegraphdb, triples, exp_triples, sparql_client):
    conjunctive = graph_from_triples(triples, ConjunctiveGraph)
    m = Migration()
    g = graph()
    m.replace_SCHEMA_creator(g, conjunctive)

    exp_g = graph_from_triples(exp_triples)
    assert len(exp_g ^ g) == 0
