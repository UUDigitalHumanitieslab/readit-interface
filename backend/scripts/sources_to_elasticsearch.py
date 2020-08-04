"""
Script for moving all source texts from file store to Elasticsearch.

Usage: open an interactive Python shell with Django's `shell`
command. Then:

>>> from scripts.sources_to_elasticsearch import text_to_index
>>> text_to_index()
"""

if __name__ == '__main__':
    import sys
    print(__doc__)
    sys.exit()

from os import environ
from os.path import isfile, join
import html

environ.setdefault('DJANGO_SETTINGS_MODULE', 'readit.settings')
from django.conf import settings
from django.core.files.storage import default_storage
from elasticsearch import Elasticsearch

from rdf.ns import SCHEMA, ISO6391
from sources.graph import graph as sources_graph
from sources.utils import get_media_filename, get_serial_from_subject

es = Elasticsearch(hosts=[{'host': settings.ES_HOST, 'port': settings.ES_PORT}])

def text_to_index():
    lang_predicate = SCHEMA.inLanguage
    subjects = set(sources_graph().subjects())
    for s in subjects:
        serial = get_serial_from_subject(s)
        result = es.search(body={
            "query" : {
                "term" : { "id" : serial }
            }
        }, index=settings.ES_ALIASNAME)
        if result['hits']['total']['value'] > 0:
            continue
        filename = join(settings.MEDIA_ROOT, get_media_filename(serial))
        if not isfile(filename):
            continue
        _, _, language_object = next(sources_graph().triples((s, lang_predicate, None)))
        language = resolve_language(language_object)
        with open(filename, 'r', encoding='utf8') as f:
            text = f.read()
        es.index(settings.ES_ALIASNAME, {
            'id': serial,
            'language': language,
            'text': text,
            'text_{}'.format(language): text
        })


def resolve_language(input_language):
        known_languages = {
            ISO6391.en: 'en',
            ISO6391.de: 'de',
            ISO6391.nl: 'nl',
            ISO6391.fr: 'fr'
        }
        result = known_languages.get(input_language)
        if result:
            return result
        else:
            return 'other'

