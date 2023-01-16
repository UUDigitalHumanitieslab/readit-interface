from urllib.parse import unquote
from django.views.decorators.csrf import csrf_exempt
from proxy.views import proxy_view

HEADER_SEP = ', '
BROTLI = 'br'

@csrf_exempt
def decode_and_proxy(request, url):
    '''
    Decodes url and forward request to django-proxy.
    '''
    remoteurl = unquote(url)

    # Disable brotli compression
    accept_encoding = request.headers.get('accept-encoding')
    if accept_encoding:
        encodings = accept_encoding.split(HEADER_SEP)
        try:
            encodings.remove(BROTLI)
            overwrite_headers = {'accept-encoding': HEADER_SEP.join(encodings)}
            return proxy_view(request, remoteurl, requests_args={'headers': overwrite_headers})
        except ValueError:
            pass


    return proxy_view(request, remoteurl)
