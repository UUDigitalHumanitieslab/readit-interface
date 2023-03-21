'''
This contains some custom serializers to customize, for example, the user details django rest-auth returns after a successful login.
See https://django-rest-auth.readthedocs.io/en/latest/configuration.html for more details on the options.
'''

from django.contrib.auth.models import User, Permission
from django.contrib.contenttypes.models import ContentType
from rest_framework import serializers
from rdflib_django.models import Store

'''
Import code names of custom permissions that need to be passed to the frontend when user logs in.
'''
from sources.permissions import DELETE_SOURCE, UPLOAD_SOURCE
from items.permissions import VIEW_ALL_ANNOTATIONS
from sparql.permissions import SPARQL_UPDATE

CUSTOM_PERMISSIONS = [
    DELETE_SOURCE,
    UPLOAD_SOURCE,
    VIEW_ALL_ANNOTATIONS,
    SPARQL_UPDATE,
]


class UserDetailsSerializer(serializers.ModelSerializer):
    permissions = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ('username', 'email', 'first_name', 'last_name',
                  'is_staff', 'is_superuser', 'permissions')
        read_only_fields = ('username', 'email', 'is_staff', 'is_superuser')

    def get_permissions(self, user):
        permissions = []
        all_permissions = user.get_all_permissions()
        for p in all_permissions:
            index = p.rfind('.')
            code_name = p[index + 1:]
            # Filter out our own / custom permissions and leave all others
            if p.startswith('rdflib_django') and code_name in CUSTOM_PERMISSIONS:
                permissions.append(code_name)
        return permissions
