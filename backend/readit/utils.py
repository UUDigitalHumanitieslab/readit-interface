from urllib.parse import unquote
from django.views.decorators.csrf import csrf_exempt
from proxy.views import proxy_view

@csrf_exempt
def decode_and_proxy(request, url):
    '''
    Decodes url and forward request to django-proxy.
    '''
    remoteurl = unquote(url)
    return proxy_view(request, remoteurl)
