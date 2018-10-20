def test_readit(browser, base_address):
    browser.get(base_address)
    assert 'READ-IT' in browser.title


def test_readit_admin(browser, admin_address):
    browser.get(admin_address)
    assert 'Django' in browser.title


def test_readit_api(browser, api_address):
    browser.get(api_address)
    assert 'Api Root' in browser.title


def test_readit_api_auth(browser, api_auth_address):
    browser.get(api_auth_address + 'login/')
    assert 'Django REST framework' in browser.title
