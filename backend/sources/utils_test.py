from datetime import datetime

from dateutil import parser
from rdf.ns import XSD
from rdflib import Literal
from sources.utils import literal_from_datestring, optional_localized


def test_dateparser():
    test_dates = [
        ('04/12/2021 8:40', datetime(2021, 12, 4, 8, 40),
         Literal(datetime(2021, 12, 4, 8, 40), datatype=XSD.dateTime)),
        ('12/04/2021', datetime(2021, 4, 12),
         Literal(datetime(2021, 4, 12), datatype=XSD.date)),
        ('4th of may 2021', datetime(2021, 5, 4), Literal(
            datetime(2021, 5, 4), datatype=XSD.date))
    ]

    for string, dt, literal in test_dates:
        parsed = parser.parse(string, ignoretz=True, dayfirst=True)
        assert parsed == dt
        assert literal_from_datestring(string) == literal


def test_optional_localized():
    en = {
        'id': 1,
        'language': 'en',
        'text': 'a couple of words'
    }
    other = {
        'id': 2,
        'language': 'other',
        'text': 'par riječi'
    }

    assert optional_localized(en).get('text_en')
    assert not optional_localized(other).get('text_other')
