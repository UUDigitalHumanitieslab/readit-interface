from rest_framework import permissions
from rdf.utils import create_custom_permissions

'''
Custom permissions are added to the database via migrations.
See '0003_init_permissions.py' for an example.
In this file, store the code name of the permission,
to allow re-use throughout the application.

Note: if a permission needs to be passed to the frontend,
do not forget to add this value to the UserDetailsSerializer in readit.serializers
'''
UPLOAD_SOURCE = 'upload_source'
DELETE_SOURCE = 'delete_source'


class UploadSourcePermission(permissions.BasePermission):
    '''
    Custom permission as a DRF permission class, to be used in DRF views.
    Example: `permission_classes = [UploadSourcePermission,]`
    '''
    message = 'Uploading sources not allowed.'

    def has_permission(self, request, view):
        if not request.method == 'POST':
            return True
        return request.user.has_perm('rdflib_django.{}'.format(UPLOAD_SOURCE))


class DeleteSourcePermission(permissions.BasePermission):
    '''
    Custom permission as a DRF permission class, to be used in DRF views.
    Example: `permission_classes = [DeleteSourcePermission,]`
    '''
    message = 'Deleting sources not allowed.'

    def has_permission(self, request, view):
        if not request.method == 'DELETE':
            return True
        return request.user.has_perm('rdflib_django.{}'.format(DELETE_SOURCE))
