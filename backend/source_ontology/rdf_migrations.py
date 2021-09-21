import rdflib
from ontology.rdf_migrations import replace_objects, replace_predicate
from rdf.migrations import RDFMigration, on_add
from rdf.ns import SCHEMA, UNKNOWN
from rdflib.namespace import OWL, XSD
from sources.graph import graph as sources_graph
from typing_extensions import Literal
from vocab import namespace as VOCAB

from . import namespace as SOURCE_ONTOLOGY
from .fixture import canonical_graph
from .graph import graph

REPLACE_PREDICATE_UPDATE = '''
    DELETE {
        ?s ?before ?o .
    }
    INSERT {
        ?s ?after ?o .
    }
    WHERE {
        ?s ?before ?bo .
'''

REPLACE_SOURCE_DEFINITION_UPDATE = '''
    DELETE {
        ?s a ?vocabsource .
    }
    INSERT {
        ?s a ?ontologysource ;
           a ?plaintextsource ;
           ?format "text/plain" .
    }
    WHERE {
        ?s a ?vocabsource
    }
'''


def replace_predicate_sparql(before, after, input_graph=None):
    # Replace predicates in graph (default: source)
    context = input_graph if input_graph else sources_graph()
    context.update(REPLACE_PREDICATE_UPDATE, initBindings={
        'before': before,
        'after': after
    })


class Migration(RDFMigration):
    actual = staticmethod(graph)
    desired = staticmethod(canonical_graph)

    # changed predicates
    before_after_predicates = (
        (SCHEMA.name, SOURCE_ONTOLOGY.title),
        (SCHEMA.editor, SOURCE_ONTOLOGY.editor),
        (SCHEMA.publisher, SOURCE_ONTOLOGY.publisher),
        (SCHEMA.inLanguage, SOURCE_ONTOLOGY.language),
        (OWL.sameAs, SOURCE_ONTOLOGY.url),
        (SCHEMA.datePublished, SOURCE_ONTOLOGY.datePublished),
    )

    # new predicates with default
    # if no default, no triples are added
    new_predicates = (
        (SOURCE_ONTOLOGY.public, Literal('true', datatype=XSD.boolean)),
        (SOURCE_ONTOLOGY.dateCreated, None),
        (SOURCE_ONTOLOGY.dateRetrieved, None),
        (SOURCE_ONTOLOGY.repository, None),
    )

    # source type mapping
    sourcetype_mapping = (
        (SCHEMA.Book, SOURCE_ONTOLOGY.TFO02_Book),
        (SCHEMA.Article, SCHEMA.Article),  # no suitable replacement
        (SCHEMA.Review, SCHEMA.Review),  # no suitable replacement
        # no suitable replacement
        (SCHEMA.SocialMediaPosting, SOURCE_ONTOLOGY.SocialMediaPosting),
        (SCHEMA.WebContent, SOURCE_ONTOLOGY.WebContent),  # no suitable replacement
        (UNKNOWN, SOURCE_ONTOLOGY.TFO27_Unknown)
    )

    # added
    added = ['encodingformat', ]
    changed = ['sourceType', ]

    @on_add(SOURCE_ONTOLOGY.title)
    def source_ontology_changes(self):
        for before, after in self.before_after_predicates:
            replace_predicate_sparql(before, after)

    @on_add(SOURCE_ONTOLOGY.public)
    def source_ontology_additions(self):
        # add new predicates (only public has a default and needs to be added)
        querystring = 'INSERT {?s ?public ?pubdefault} WHERE {?s ?p ?o}'
        sources_graph().update(querystring, initBindings={
            'public': SOURCE_ONTOLOGY.public,
            'pubdefault': Literal('false', datatype=XSD.boolean)
        })

    @on_add(SOURCE_ONTOLOGY.Source)
    def source_ontology_types(self):
        # map old source types to new
        for before, after in self.sourcetype_mapping:
            replace_objects(before, after, sources_graph())

        # add encodingFormat and PlainTextSource instance for each source
        sources_graph().update(
            REPLACE_SOURCE_DEFINITION_UPDATE,
            initBindings={
                'vocabsource': VOCAB.Source,
                'ontologysource': SOURCE_ONTOLOGY.Source,
                'plaintextsource': SOURCE_ONTOLOGY.PlainTextSource,
                'format': SOURCE_ONTOLOGY.encodingFormat
            }
        )
