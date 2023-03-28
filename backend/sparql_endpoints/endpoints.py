from items.constants import ITEMS_SLUG
from items.graph import graph as items_graph

from nlp_ontology.constants import NLP_ONTOLOGY_ROUTE
from nlp_ontology.graph import graph as nlp_ontology_graph

from ontology.constants import ONTOLOGY_ROUTE
from ontology.graph import graph as ontology_graph

from sources.constants import SOURCES_SLUG
from sources.graph import graph as sources_graph

from vocab.constants import VOCAB_ROUTE
from vocab.graph import graph as vocab_graph

SPARQL_ENDPOINTS = [
    {
        'route': ITEMS_SLUG,
        'graph': items_graph,
        'enable_update': True,
    },
    {
        'route': NLP_ONTOLOGY_ROUTE,
        'graph': nlp_ontology_graph,
        'enable_update': True,
    },
    {
        'route': ONTOLOGY_ROUTE,
        'graph': ontology_graph,
        'enable_update': False,
    },
    {
        'route': SOURCES_SLUG,
        'graph': sources_graph,
        'enable_update': True,
    },
    {
        'route': VOCAB_ROUTE,
        'graph': vocab_graph,
        'enable_update': False,
    },
]
