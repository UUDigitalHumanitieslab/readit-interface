from typing import Dict


TEXT_FILENAME_PATTERN = 'sources/{:0>8}.txt'


def get_media_filename(serial):
    """
    Returns the path relative to settings.MEDIA_ROOT where the text
    of a source with the given serial should be saved.
    """
    return TEXT_FILENAME_PATTERN.format(serial)


def get_serial_from_subject(subject):
    return str(subject).split('/')[-1]


def optional_localized(document: Dict) -> Dict:
    '''Optionally adds text_<language> field to elasticsearch index
    Skipped if language = 'other'
    '''
    language = document['language']
    if language != 'other':
        document['text_{}'.format(language)] = document['text']
    return document
