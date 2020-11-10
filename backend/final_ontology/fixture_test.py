from django.conf import settings
from os.path import join
from rdflib import Graph

nsfile = join(settings.BASE_DIR, 'final_ontology',
              'namespace_READIT_ongoing.rdf')


def test_fixture():
    g = Graph().parse(nsfile, format='xml')
    assert len(g) == 285
