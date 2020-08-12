from django.urls import path, re_path

from rest_framework.urlpatterns import format_suffix_patterns

from .views import SourcesAPIRoot, SourcesAPISingular, search_sources, source_fulltext, AddSource

app_name = 'sources'
urlpatterns = format_suffix_patterns([
    path('add/', AddSource.as_view()),
    path('', SourcesAPIRoot.as_view()),
    path('<int:serial>', SourcesAPISingular.as_view()),
    path('<int:serial>/fulltext', source_fulltext, name='fulltext'),
    path('search', search_sources, name='search-fulltext')
])
