from datetime import datetime

from dateutil import parser
from rdf.ns import XSD
from rdflib import Literal
from sources.utils import literal_from_datestring


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
