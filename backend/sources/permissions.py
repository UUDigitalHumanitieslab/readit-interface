from rest_framework import permissions
from rdf.utils import create_custom_permissions

'''
Constant(s) with the code name for custom permissions.
Note: if a permission needs to be passed to the frontend,
do not forget to add this value to the UserDetailsSerializer in readit.serializers
'''
UPLOAD_SOURCE = 'upload_source'
DELETE_SOURCE = 'delete_source'

custom_permissions = [
    {'name': 'Can upload Source', 'codename': UPLOAD_SOURCE},
    {'name': 'Can delete Source', 'codename': DELETE_SOURCE}
]

'''
Make sure the required custom permissions exist.
'''
create_custom_permissions(custom_permissions)


class UploadSourcePermission(permissions.BasePermission):
    '''
    Custom permission as a DRF permission class, to be used in DRF views.
    Example: `permission_classes = [UploadSourcePermission,]`
    '''
    message = 'Uploading sources not allowed.'

    def has_permission(self, request, view):
        return request.user.has_perm('rdflib_django.{}'.format(UPLOAD_SOURCE))


class DeleteSourcePermission(permissions.BasePermission):
    '''
    Custom permission as a DRF permission class, to be used in DRF views.
    Example: `permission_classes = [DeleteSourcePermission,]`
    '''
    message = 'Deleting sources not allowed.'

    def has_permission(self, request, view):
        return request.user.has_perm('rdflib_django.{}'.format(DELETE_SOURCE))
