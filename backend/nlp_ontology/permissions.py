from rest_framework.permissions import BasePermission
from django.contrib.auth.models import Group


class SPARQLPermission(BasePermission):
    ''' Custom permission for SPARQL update endpoint.
        Only users in group 'sparql' or admin users are allowed acces.'''

    message = 'Only user in "SPARQL" group or admin can access SPARQL update endpoint'

    group_name = "sparql"

    def has_permission(self, request, view):
        if request.user.is_staff:
            return True
        try:
            group = request.user.groups.get(name=self.group_name)
        except Group.DoesNotExist:
            return False
        return group.name == self.group_name
