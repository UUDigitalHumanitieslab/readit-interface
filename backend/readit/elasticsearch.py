from django.conf import settings
from elasticsearch import Elasticsearch


def get_elasticsearch_client():
    '''
    Initialize an Elasticsearch client to reuse throughout the application
    '''

    node = {'host': settings.ES_HOST,
            'port': int(settings.ES_PORT),
            'scheme': 'http'
            }
    kwargs = {
        'max_retries': 15,
        'retry_on_timeout': True,
        'timeout': 60
    }
    try:
        # settings to connect via SSL are present (i.e., running on server)
        node['scheme'] = 'https'
        kwargs['ca_certs'] = settings.CERTS_LOCATION
        kwargs['api_key'] = settings.ES_API_KEY
    except AttributeError:
        pass
    client = Elasticsearch([node], **kwargs)
    return client
