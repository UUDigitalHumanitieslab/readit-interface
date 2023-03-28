from django.urls import path
from sparql_endpoints.views import sparql_query_view, sparql_update_view
from sparql_endpoints.endpoints import SPARQL_ENDPOINTS
from rest_framework.urlpatterns import format_suffix_patterns
from typing import List, TypeVar, Callable

def sparql_query_url(endpoint_setting):
    '''
    Create a query view based on the setting for a SPARQL endpoint.

    Returns a django `path` for the query endpoint.
    '''

    route = endpoint_setting['route']
    view = sparql_query_view(endpoint_setting)
    return path('{}/query'.format(route), view.as_view())

def sparql_update_url(endpoint_setting):
    '''
    Create an update view based on the setting for a SPARQL endpoint.

    Returns a django `path` for the update endpoint.
    '''

    route = endpoint_setting['route']
    view = sparql_update_view(endpoint_setting)
    return path('{}/update'.format(route), view.as_view())

def sparql_endpoint_urls(endpoint_setting):
    '''
    Returns a generator of urls for the given endpoint setting.
    '''

    yield sparql_query_url(endpoint_setting)

    if endpoint_setting['enable_update']:
        yield sparql_update_url(endpoint_setting)

T1 = TypeVar('T1')
T2 = TypeVar('T2')

def flatmap(func: Callable[[T1], List[T2]], collection: List[T1]) -> List[T2]:
    '''
    Apply `func` to each tiem in `collection` and flatten the result
    into a single list.
    '''
    return [
        output
        for item in collection
        for output in func(item)
    ]

'''Generator of all urls based on the SPARQL_ENDPOINTS setting.'''
SPARQL_URLS = flatmap(sparql_endpoint_urls, SPARQL_ENDPOINTS)

urlpatterns = format_suffix_patterns(SPARQL_URLS)

