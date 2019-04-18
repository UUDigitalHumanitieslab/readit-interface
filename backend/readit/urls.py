"""readit URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/1.11/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  url(r'^$', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  url(r'^$', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.conf.urls import url, include
    2. Add a URL to urlpatterns:  url(r'^blog/', include('blog.urls'))
"""
from django.conf.urls import url, include
from django.contrib import admin

from rest_framework import routers

from .index import index

from annotation import views as annotation_views

api_router = routers.DefaultRouter()  # register viewsets with this router
api_router.register(r'source', annotation_views.SourceViewSet, base_name='source')
api_router.register(r'annotation', annotation_views.AnnotationViewSet, base_name='annotation')

urlpatterns = [
    url(r'^admin/', admin.site.urls),
    url(r'^api/', include(api_router.urls)),
    url(r'^api-auth/', include(
        'rest_framework.urls',
        namespace='rest_framework',
    )),
    url(r'^rest-auth/', include('rest_auth.urls')),
    url(r'', index),  # catch-all; unknown paths to be handled by a SPA
]
