from django.urls import path, re_path

from rest_framework.urlpatterns import format_suffix_patterns

from .views import SourcesAPIRoot, SourcesAPISingular, \
    SourceSelection, SourceHighlights, source_fulltext, AddSource, \
    get_number_search_results

app_name = 'sources'
urlpatterns = format_suffix_patterns([
    path('add/', AddSource.as_view()),
    path('', SourcesAPIRoot.as_view()),
    path('<int:serial>', SourcesAPISingular.as_view()),
    path('<int:serial>/fulltext', source_fulltext, name='fulltext'),
    path('search', SourceSelection.as_view(), name='search-fulltext'),
    path('results_count', get_number_search_results, name='results_count'),
    path('highlight', SourceHighlights.as_view(), name='highlight'),
])
