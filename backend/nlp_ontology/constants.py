from django.conf import settings

NLP_ONTOLOGY_ROUTE = 'nlp-ontology'
NLP_ONTOLOGY_NS = '{}{}#'.format(
    settings.RDF_NAMESPACE_ROOT, 'nlp-ontology')

NLP_NS = 'https://read-it.hum.uu.nl/nlp-ontology'
INSTANCE_NLP_NS = '{}nlp-ontology'.format(settings.RDF_NAMESPACE_ROOT)