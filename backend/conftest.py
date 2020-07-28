import pytest


@pytest.fixture
def credentials():
    return 'tester', 'testing123'


@pytest.fixture
def auth_client(client, django_user_model, credentials):
    username, password = credentials
    django_user_model.objects.create_user(username=username, password=password)
    client.login(username=username, password=password)
    yield client
    client.logout()
    django_user_model.objects.get(username=username).delete()
