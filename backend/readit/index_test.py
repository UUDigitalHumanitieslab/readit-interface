def test_index_available(client):
    assert client.get('/').status_code == 200
