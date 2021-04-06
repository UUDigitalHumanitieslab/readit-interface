from django.conf import settings
from os.path import join
from rdflib import Graph

nsfile = join(settings.BASE_DIR, 'final_ontology',
              'REO_v2.4.owl')


def test_fixture():
    g = Graph().parse(nsfile, format='xml')
    assert len(g) == 580
