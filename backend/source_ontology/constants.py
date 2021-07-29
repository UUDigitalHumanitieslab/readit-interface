from django.conf import settings
import os

SOURCE_ONTOLOGY_ROUTE = 'source-ontology'
SOURCE_ONTOLOGY_NS = '{}{}#'.format(
    settings.RDF_NAMESPACE_ROOT, 'source-ontology')

SOURCE_ONTOLOGY_FILE = os.path.join(
    settings.BASE_DIR, 'source_ontology', 'ReaditSourceOntology.owl')
SOURCE_FORMAT = 'turtle'
SOURCE_PREFIX = 'https://read-it.acc.hum.uu.nl/source-ontology#'
