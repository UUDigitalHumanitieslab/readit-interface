"""readit URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/2.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.urls import path, re_path, include
from django.contrib import admin
from django.conf import settings

from rest_framework import routers

from vocab import VOCAB_ROUTE
from staff import STAFF_ROUTE
from ontology import ONTOLOGY_ROUTE
from nlp_ontology import NLP_ONTOLOGY_ROUTE
from source_ontology import SOURCE_ONTOLOGY_ROUTE
from sources import SOURCES_ROUTE
from items import ITEMS_ROUTE
from sparql import SPARQL_ROUTE
from .index import index, specRunner
from .utils import decode_and_proxy
from feedback.views import FeedbackViewSet

api_router = routers.DefaultRouter()  # register viewsets with this router
api_router.register(r'feedback', FeedbackViewSet, basename='feedback')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(api_router.urls)),
    path('api-auth/', include(
        'rest_framework.urls',
        namespace='rest_framework',
    )),
    path('rest-auth/', include('rest_auth.urls')),
    path('rest-auth/registration/', include('register.urls')),
    re_path(r'proxy/(?P<url>.*)', decode_and_proxy),
    path(VOCAB_ROUTE, include('vocab.urls')),
    path(STAFF_ROUTE, include('staff.urls')),
    path(ONTOLOGY_ROUTE, include('ontology.urls')),
    path(NLP_ONTOLOGY_ROUTE, include('nlp_ontology.urls')),
    path(SOURCE_ONTOLOGY_ROUTE, include('source_ontology.urls')),
    path(SOURCES_ROUTE, include('sources.urls')),
    path(ITEMS_ROUTE, include('items.urls')),
    path(SPARQL_ROUTE, include('sparql.urls')),
]


# Inject any Jasmine testing page from a frontend during development.
if settings.DEBUG:
    urlpatterns.append(path('specRunner.html', specRunner))

# Catch-all; unknown paths to be handled by a SPA.
urlpatterns.append(re_path(r'', index))
