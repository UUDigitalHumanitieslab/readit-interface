"""
Django settings for readit project.

Generated by 'django-admin startproject' using Django 2.2.5.

For more information on this file, see
https://docs.djangoproject.com/en/2.2/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/2.2/ref/settings/
"""

import os

from rdflib.plugins.stores.sparqlstore import SPARQLUpdateStore

# Build paths inside the project like this: os.path.join(BASE_DIR, ...)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/2.2/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = 'll9*4+3uzfl2@_(_%+j8gltmqd2!w^3fxrf7oiohv2vifl+da5'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

# RDF_NAMESPACE_ROOT is the common prefix for our own graphs
# (vocab, team, readit, source and item). If DEBUG == False, you
# probably want to add the RDF_NAMESPACE_HOST to the ALLOWED_HOSTS.
RDF_NAMESPACE_HOST = 'localhost'
RDF_NAMESPACE_ROOT = 'http://{}:8000/'.format(RDF_NAMESPACE_HOST)

ALLOWED_HOSTS = []

# Default store for our graphs.
RDFLIB_STORE_PREFIX = 'http://localhost:3030/readit'
RDFLIB_STORE = SPARQLUpdateStore(
    queryEndpoint='{}/query'.format(RDFLIB_STORE_PREFIX),
    update_endpoint='{}/update'.format(RDFLIB_STORE_PREFIX),
)

# Celery configuration
CELERY_BROKER_URL = 'amqp://'
CELERY_BACKEND = 'amqp'

IRISA_WAIT = 300 # wait for 5 minutes between requests to Irisa API
IRISA_URL = 'https://allgo18.inria.fr/api/v1'
# set IRISA_TOKEN as env variable
IRISA_TOKEN = os.environ.get('IRISA_TOKEN')

# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'livereload',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework.authtoken',
    'rest_auth',
    'django.contrib.sites',
    'allauth',
    'allauth.account',
    'allauth.socialaccount',
    'rest_auth.registration',
    'rdflib_django',
    'corsheaders',
    'rdf',
    'vocab',
    'staff',
    'ontology',
    'nlp_ontology',
    'items',
    'sources',
    'register',
    'feedback',
    'sparql',
]

# This is required by rest-auth registration
SITE_ID = 1

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'livereload.middleware.LiveReloadScript',
]

ROOT_URLCONF = 'readit.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'readit.wsgi.application'


# Cross-origin resource sharing (CORS)
# https://github.com/adamchainz/django-cors-headers

CORS_ORIGIN_ALLOW_ALL = True
CORS_URLS_REGEX = r'^/((vocab|staff|ontology|nlp-ontology)|(source|item|nlp-ontology)/.*)$'
CORS_ALLOW_METHODS = ('GET', 'HEAD', 'OPTIONS')


# Database
# https://docs.djangoproject.com/en/2.2/ref/settings/#databases

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'readit',
        'USER': 'readit',
        'PASSWORD': 'readit',
        'HOST': 'localhost',
    }
}


# Password validation
# https://docs.djangoproject.com/en/2.2/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

REST_AUTH_SERIALIZERS = {
    'USER_DETAILS_SERIALIZER': 'readit.serializers.UserDetailsSerializer',
}

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'readit.authentication.CsrfExemptSessionAuthentication',
        'rest_framework.authentication.TokenAuthentication',
    ]
}

# Internationalization
# https://docs.djangoproject.com/en/2.2/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'Europe/Amsterdam'

USE_I18N = True

USE_L10N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/2.2/howto/static-files/

STATIC_URL = '/static/'

STATICFILES_DIRS = []

INDEX_FILE_PATH = 'index.html'
TESTRUNNER_FILE_PATH = ''  # override in order to enable an external test runner


# Uploads
# https://docs.djangoproject.com/en/2.2/topics/files/

MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# Settings for (email) registration
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
EMAIL_CONFIRMATION_URL = "http://localhost:8000/confirm-registration"
DEFAULT_FROM_EMAIL = "donotreply@read-it.hum.uu.nl"

ACCOUNT_ADAPTER = 'register.allauth.CustomAccountAdapter'
ACCOUNT_EMAIL_VERIFICATION = "optional"

# Suppress warnings
SILENCED_SYSTEM_CHECKS = ['urls.W002']

ES_HOST = "localhost"
ES_PORT = "9200"
ES_ALIASNAME = "readit"


RESULTS_PER_PAGE = 2

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'standard': {
            'format': '\n --> %(asctime)s %(levelname)s in '
                        '%(pathname)s:%(lineno)d\n%(message)s',
        },
    },
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': os.path.join(BASE_DIR, '..', 'readit.log'),
            'formatter': 'standard',
        },
        'console': {
            'level': 'WARNING',
            'class': 'logging.StreamHandler',
            'formatter': 'standard'
        }
    },
    'loggers': {
        'django': {
            'handlers': ['file'],
            'level': 'DEBUG',
            'propagate': True,
        },
        'rest_framework': {
            'handlers': ['file'],
            'level': 'DEBUG',
            'propagate': True,
        },
        'rest_auth': {
            'handlers': ['file'],
            'level': 'DEBUG',
            'propagate': True,
        },
        'readit': {
            'handlers': ['file'],
            'level': 'DEBUG',
            'propagate': True,
        },
        'rdflib': {
            'handlers': ['file'],
            'level': 'DEBUG',
            'propagate': True,
        },
        'annotation': {
            'handlers': ['file'],
            'level': 'DEBUG',
            'propagate': True,
        },
        'vocab': {
            'handlers': ['file'],
            'level': 'DEBUG',
            'propagate': True,
        },
        'staff': {
            'handlers': ['file'],
            'level': 'DEBUG',
            'propagate': True,
        },
        'ontology': {
            'handlers': ['file'],
            'level': 'DEBUG',
            'propagate': True,
        },
        'nlp_ontology': {
            'handlers': ['file'],
            'level': 'DEBUG',
            'propagate': True,
        },
        'items': {
            'handlers': ['file'],
            'level': 'DEBUG',
            'propagate': True,
        },
        'sources': {
            'handlers': ['file'],
            'level': 'DEBUG',
            'propagate': True,
        },
        'rdflib_django': {
            'handlers': ['file'],
            'level': 'DEBUG',
            'propagate': True,
        },
        'corsheaders': {
            'handlers': ['file'],
            'level': 'DEBUG',
            'propagate': True,
        },
        'rdf': {
            'handlers': ['file'],
            'level': 'DEBUG',
            'propagate': True,
        },
        'scripts': {
            'handlers': ['file'],
            'level': 'DEBUG',
            'propagate': True,
        }
    },
}
