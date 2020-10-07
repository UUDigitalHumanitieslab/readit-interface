from rdf.migrations import RDFMigration, on_present
from .graph import graph
from .fixture import canonical_graph
from rdf.ns import SCHEMA

REPLACE_CREATOR_UPDATE = '''
DELETE {
    ?s ?creator ?o .
}
INSERT {
    ?s ?author ?o .
}
WHERE {
    ?s ?creator ?o .
}
'''


class Migration(RDFMigration):
    actual = staticmethod(graph)
    desired = staticmethod(canonical_graph)

    @on_present(SCHEMA.author)
    def replace_SCHEMA_creator(self, actual, conjunctive):
        graph().update(REPLACE_CREATOR_UPDATE,
                       initBindings={'creator': SCHEMA.creator,
                                     'author': SCHEMA.author})
