import os.path as op

from django.conf import settings

ONTOLOGY_ROUTE = 'ontology'
ONTOLOGY_NS = '{}{}#'.format(settings.RDF_NAMESPACE_ROOT, ONTOLOGY_ROUTE)

# External file or URL from which we're loading the RDF-encoded ontology.
# This is hardcoded, i.e., not a setting, because migrations depend
# on the exact contents.
OLD_SOURCE = op.join(settings.BASE_DIR, 'ontology', 'mock-ontology.jsonld')
SOURCE = 'https://raw.githubusercontent.com/eureadit/reading-experience-ontology/master/REO_2.4.1.owl'

# Format must be a string that rdflib recognizes.
# SOURCE_FORMAT = 'json-ld'
SOURCE_FORMAT = 'xml'

# Namespace prefix that is used in the source. If different from
# ONTOLOGY_NS, this needs to be replaced.
OLD_SOURCE_PREFIX = 'http://readit.example/ontology/'
SOURCE_PREFIX = 'http://dataforhistory.org/read-it-ongoing/'
SOURCE_PROPERTY_PREFIX = SOURCE_PREFIX + 'property/'
SOURCE_CLASS_PREFIX = SOURCE_PREFIX + 'class/'
