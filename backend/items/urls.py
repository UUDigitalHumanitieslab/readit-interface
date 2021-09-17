from django.urls import path

from rest_framework.urlpatterns import format_suffix_patterns

from .views import ItemsAPIRoot, ItemsAPIDownload, ItemsAPISingular, ItemSuggestion, ItemsOfCategory, get_item_counter

urlpatterns = format_suffix_patterns([
    path('', ItemsAPIRoot.as_view()),
    path('download', ItemsAPIDownload.as_view()),
    path('<int:serial>', ItemsAPISingular.as_view()),
    path('suggestion', ItemSuggestion.as_view(), name='item_suggest'),
    path('current', get_item_counter, name='item_counter'),
    path('<slug:category>', ItemsOfCategory.as_view()),
])
