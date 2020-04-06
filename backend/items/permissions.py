from rest_framework import permissions
from rdf.utils import create_custom_permissions

'''
Constant(s) with the code name for custom permissions.
Note: if a permission needs to be passed to the frontend,
do not forget to add this value to the UserDetailsSerializer in readit.serializers
'''
VIEW_ALL_ANNOTATIONS = 'view_all_annotations'

custom_permissions = [
    {'name': 'Can view all annotations', 'codename': VIEW_ALL_ANNOTATIONS}
]

'''
Make sure the required custom permissions exist.
'''
create_custom_permissions(custom_permissions)
