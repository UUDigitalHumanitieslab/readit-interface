from dateutil import parser
from rdflib import Literal
from rdf.ns import XSD

TEXT_FILENAME_PATTERN = 'sources/{:0>8}.txt'


def get_media_filename(serial):
    """
    Returns the path relative to settings.MEDIA_ROOT where the text
    of a source with the given serial should be saved.
    """
    return TEXT_FILENAME_PATTERN.format(serial)


def get_serial_from_subject(subject):
    return str(subject).split('/')[-1]


def has_time(dt):
    # Determine if a datetime object has a defined time
    must_be_zero = ['hour', 'minute', 'second', 'microsecond']
    return any([getattr(dt, x) != 0 for x in must_be_zero])


def parse_isodate(datestring):
    try:
        dt = parser.isoparse(datestring)
        if has_time(dt):
            return Literal(dt, datatype=XSD.dateTime)
        return Literal(dt, datatype=XSD.date)
    except ValueError:
        return Literal(datestring)


def literal_from_datestring(datestr, ignoretz=True):
    # Attempts to parse string as date/datetime
    # Returns adequatly formatted Literal
    try:
        dt = parser.parse(timestr=datestr, ignoretz=ignoretz, dayfirst=True)
        if has_time(dt):
            return Literal(dt, datatype=XSD.dateTime)
        return Literal(dt, datatype=XSD.date)
    except parser.ParserError:
        return Literal(datestr)
