from django.http import HttpResponse
from django.contrib.staticfiles import finders
from django.views.decorators.csrf import ensure_csrf_cookie


def html_view(filename):
    """ Return a view function that loads `filename` from the static files. """
    def fetch_html(request):
        return HttpResponse(content=open(finders.find(filename)))
    return fetch_html


""" Thin wrapper for the static index.html that adds the CSRF cookie."""
index = ensure_csrf_cookie(html_view('index.html'))

""" Helper view for injecting a Jasmine runner from a frontend. """
specRunner = html_view('specRunner.html')
