from rest_framework import permissions
from rdf.utils import create_custom_permissions

custom_permissions = [
    {'name': 'Can view all annotations', 'codename': 'view_all_annotations'}
]

'''
Make sure the required custom permissions exist.
'''
create_custom_permissions(custom_permissions)
