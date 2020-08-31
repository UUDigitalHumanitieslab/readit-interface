TEXT_FILENAME_PATTERN = 'sources/{:0>8}.txt'


def get_media_filename(serial):
    """
    Returns the path relative to settings.MEDIA_ROOT where the text
    of a source with the given serial should be saved.
    """
    return TEXT_FILENAME_PATTERN.format(serial)


def get_serial_from_subject(subject):
    return str(subject).split('/')[-1]