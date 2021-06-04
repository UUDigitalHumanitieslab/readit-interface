"""
Script for replacing nlp namespace

Usage: open an interactive Python shell with Django's `shell`
command. When working on a server, pass the arguments `--settings
settings --pythonpath {directory/of/settings/file}`.
Then:
>>> from scripts.replace_nlp_namespace import replace_nlp_namespace
>>> replace_nlp_namespace()
"""

if __name__ == '__main__':
    import sys
    print(__doc__)
    sys.exit()

from django.conf import settings
from rdflib import Graph

from ontology.fixture import replace_prefix
from sources.constants import NLP_NS, INSTANCE_NLP_NS

def replace_nlp_namespace():
    g = Graph(settings.RDFLIB_STORE, NLP_ONTOLOGY_NS)
    replace_prefix(g, NLP_NS, INSTANCE_NLP_NS)