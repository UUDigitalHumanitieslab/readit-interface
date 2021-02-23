from itertools import chain

from rest_framework.urlpatterns import format_suffix_patterns

from .endpoints.items import ITEMS_URLS
from .endpoints.nlp_ontology import NLP_ONTOLOGY_URLS
from .endpoints.ontology import ONTOLOGY_URLS
from .endpoints.sources import SOURCES_URLS
from .endpoints.vocab import VOCAB_URLS
from .endpoints.final_ontology import FINAL_ONTOLOGY_URLS

urlpatterns = format_suffix_patterns(chain(
    ITEMS_URLS,
    NLP_ONTOLOGY_URLS,
    ONTOLOGY_URLS,
    SOURCES_URLS,
    VOCAB_URLS,
    FINAL_ONTOLOGY_URLS
))
