def test_readit(browser):
    browser.get('http://localhost:8080')
    assert 'READ-IT' in browser.title


def test_readit_admin(browser):
    browser.get('http://localhost:8080/admin/')
    assert 'Django' in browser.title


def test_readit_api(browser):
    browser.get('http://localhost:8080/api/')
    assert 'Api Root' in browser.title


def test_readit_api_auth(browser):
    browser.get('http://localhost:8080/api-auth/login/')
    assert 'Django REST framework' in browser.title
