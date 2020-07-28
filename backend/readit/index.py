from django.http import HttpResponse
from django.contrib.staticfiles import finders
from django.views.decorators.csrf import ensure_csrf_cookie
from django.conf import settings


def html_view(filename):
    """ Return a view function that loads `filename` from the static files. """
    def fetch_html(request):
        return HttpResponse(content=open(finders.find(filename)))
    return fetch_html


""" Thin wrapper for the static index.html that adds the CSRF cookie."""
index = ensure_csrf_cookie(html_view(settings.INDEX_FILE_PATH))

""" Helper view for injecting a Jasmine runner from a frontend. """
specRunner = html_view(settings.TESTRUNNER_FILE_PATH)
