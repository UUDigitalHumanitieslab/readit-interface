from rest_framework import permissions

'''
Custom permissions are added to the database via migrations.
See '0003_init_permissions.py' for an example.
In this file, store the code name of the permission,
to allow re-use throughout the application.

Note: if a permission needs to be passed to the frontend,
do not forget to add this value to the UserDetailsSerializer in readit.serializers
'''
VIEW_ALL_ANNOTATIONS = 'view_all_annotations'
