from rdflib import Literal
from items.graph import graph as item_graph
from sparql.utils import find_invalid_xml, xml_sanitize_triple
from django.conf import settings
from os import environ
from lxml.etree import XMLSyntaxError
environ.setdefault('DJANGO_SETTINGS_MODULE', 'readit.settings')


settings.RDFLIB_STORE.returnFormat = 'json'


def find_dirty_triples():
    try:
        g = item_graph()
        for triple in g:
            is_cleaned, cleaned_triple = xml_sanitize_triple(triple)
            if is_cleaned:
                print(triple, cleaned_triple)
    except XMLSyntaxError:
        print("Cant parse graph, use resultFormat='json'")


def clean_dirty_triples():
    g = item_graph()
    for triple in g:
        if any(isinstance(term, Literal) for term in triple):
            for term in triple:
                pass
