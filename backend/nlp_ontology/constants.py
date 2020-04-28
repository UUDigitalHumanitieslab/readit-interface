from django.conf import settings

NLP_ONTOLOGY_ROUTE = 'nlp-ontology/'
NLP_ONTOLOGY_NS = '{}{}#'.format(
    settings.RDF_NAMESPACE_ROOT, 'nlp-ontology')

# External file or URL from which we're loading the RDF-encoded ontology.
# This is hardcoded, i.e., not a setting, because migrations depend
# on the exact contents.
SOURCE = op.join(settings.BASE_DIR, 'nlp_ontology', 'mock-ontology.jsonld')

# Format must be a string that rdflib recognizes.
SOURCE_FORMAT = 'json-ld'

# Namespace prefix that is used in the source. If different from
# ONTOLOGY_NS, this needs to be replaced.
SOURCE_PREFIX = 'http://readit.example/ontology/'
