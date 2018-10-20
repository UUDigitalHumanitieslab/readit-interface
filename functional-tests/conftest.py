import pytest
from selenium import webdriver

WEBDRIVER_INI_NAME = 'webdriver'


def pytest_addoption(parser):
    """ py.test hook where we register configuration options and defaults. """
    parser.addini(
        WEBDRIVER_INI_NAME,
        'Specify browsers in which the tests should run',
        type='linelist',
        default=['Chrome' ,'Firefox'],
    )


def pytest_generate_tests(metafunc):
    """ py.test hook where we inject configurable fixtures. """
    if 'webdriver_name' in metafunc.fixturenames:
        names = metafunc.config.getini(WEBDRIVER_INI_NAME)
        metafunc.parametrize('webdriver_name', names, scope='session')


@pytest.fixture(scope='session')
def webdriver_instance(webdriver_name):
    """ Provides a WebDriver instance that persists throughout the session.

        Use the `browser` fixture instead; it performs cleanups after each test.
    """
    factory = getattr(webdriver, webdriver_name)
    driver = factory()
    try:
        yield driver
    finally:
        driver.quit()


@pytest.fixture
def browser(webdriver_instance):
    """ Provides a WebDriver instance and performs some cleanups afterwards. """
    yield webdriver_instance
    webdriver_instance.delete_all_cookies()
