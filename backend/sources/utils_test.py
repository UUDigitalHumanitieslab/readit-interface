from sources.utils import optional_localized


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
