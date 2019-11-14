import pytest


def auth_client(client, django_user_model):
    username = 'tester'
    password = 'testing123'
    django_user_model.objects.create_user(username=username, password=password)
    client.login(username=username, password=password)
    yield client
    client.logout()
    django_user_model.objects.get(username=username).delete()
