'''
This contains some custom serializers to customize, for example, the user details django rest-auth returns after a successful login.
See https://django-rest-auth.readthedocs.io/en/latest/configuration.html for more details on the options.
'''

from django.contrib.auth.models import User
from rest_framework import serializers

class UserDetailsSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('username', 'email', 'first_name', 'last_name', 'is_staff')
