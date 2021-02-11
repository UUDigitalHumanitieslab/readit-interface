from rdf.migrations import RDFMigration, on_add, on_remove
from .graph import graph
from .fixture import canonical_graph
from . import namespace as NEW
from ontology.rdf_migrations import delete_subjects


class Migration(RDFMigration):
    def actual(self):
        g = graph()
        return g

    def desired(self):
        return canonical_graph()

    @on_add(NEW.readP17)
    def replace_environment(self, actual, conjunctive):
        delete_subjects(conjunctive, (NEW.readP17, None, None))
