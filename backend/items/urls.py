from django.urls import path

from rest_framework.urlpatterns import format_suffix_patterns

from .views import ItemsAPIRoot, ItemsAPISingular, ItemSuggestion

urlpatterns = format_suffix_patterns([
    path('', ItemsAPIRoot.as_view()),
    path('<int:serial>', ItemsAPISingular.as_view()),
    path('suggestion', ItemSuggestion.as_view(), name='item_suggest')
])
