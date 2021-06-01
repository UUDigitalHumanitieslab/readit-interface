from django.conf import settings

SOURCES_SLUG = 'source'

SOURCES_ROUTE = '{}/'.format(SOURCES_SLUG)
SOURCES_NS = '{}{}'.format(settings.RDF_NAMESPACE_ROOT, SOURCES_ROUTE)

NLP_NS = 'https://read-it.hum.uu.nl/nlp-ontology'
INSTANCE_NLP_NS = '{}nlp-ontology'.format(settings.RDF_NAMESPACE_ROOT)
