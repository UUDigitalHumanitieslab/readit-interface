# 1. Endpoints
| graph                                   | query endpoint             | update endpoint             |
|-----------------------------------------|----------------------------|-----------------------------|
| https://read-it.hum.uu.nl/item/         | /sparql/item/query         | /sparql/item/update         |
| https://read-it.hum.uu.nl/vocab#        | /sparql/vocab/query        |                             |
| https://read-it.hum.uu.nl/source/       | /sparql/source/query       | /sparql/source/update       |
| https://read-it.hum.uu.nl/ontology#     | /sparql/ontology/query     |                             |
| https://read-it.hum.uu.nl/nlp-ontology# | /sparql/nlp-ontology/query | /sparql/nlp-ontology/update |

Example full url for endpoint: https://read-it.hum.uu.nl/sparql/item/query

# 2. Query protocol

## Request
- GET request to a query endpoint.
    - Obtain the triples in the corresponding graph.
- POST request to a query endpoint.  
    - Obtain query results.
    - Only the corresponding graph will be queried.
    - Request body should contain an `query` parameter containing SPARQL QUERY. `DESCRIBE` queries are not supported.  
    - An `Accept` header can be included to specify the desired output format, see below for options.  

## Output formats
| `Accept` header                 | Format                                                                                | Applicable query types     |
|---------------------------------|---------------------------------------------------------------------------------------|------------------------|
| application/sparql-results+json (default) | [SPARQL 1.1 Query Results JSON Format](https://www.w3.org/TR/sparql11-results-json/)  | ASK, SELECT            |
| application/sparql-results+xml  | [SPARQL 1.1 Query Results XML Format](https://www.w3.org/TR/rdf-sparql-XMLres/)       | ASK, SELECT            |
| text/turtle                     | [Turtle](https://www.w3.org/TR/turtle/)                                               | ASK, SELECT, CONSTRUCT |

## Examples
Retrieve 5 sources:
#### cURL
```
curl -d "query=SELECT ?s ?p ?o WHERE {?s ?p ?o } LIMIT 5"  -X POST -H "Accept: text/turtle" https://read-it.hum.uu.nl/sparql/source/query
```

#### Python
Uses the `requests` package.
```
import requests
q = 'SELECT ?s ?p ?o WHERE {?s ?p ?o } LIMIT 5'
endpoint = 'https://read-it.hum.uu.nl/sparql/source/query'
response = requests.post(endpoint,
                         data={'query': q},
                         headers={'Accept': 'text/turtle'})
results = response.text
print(results)
```

# 3. Authentication
Make a POST request to https://read-it.hum.uu.nl/rest-auth/login/ (note the trailing slash) with your username and password in the body to obtain an authentication token.

## Examples
#### cUrl
```
curl -d "username=yourusername&password=yourpassword" -X POST https:/read-it.hum.uu.nl/rest-auth/login/
```

#### Python
```
import requests
login = requests.post('https://read-it.hum.uu.nl/rest-auth/login/',
                      data={'username': 'yourusername',
                            'password': 'yourpassword'})
key = login.json()['key']

```

# 4. Update protocol

## Request
- POST request to an update endpoint.
    - Only the corresponding graph can be updated.
    - Only specific users are allowed to UPDATE. Contact admins for information.
    - Request body should contain an `update` parameter containing valid SPARQL UPDATE.
    - An `Authorization` header should be included containing your `Token <your_token>`. See above.
    - The following operations are not supported, because they make no sense in the context of a single graph, or are unsafe:
`LOAD`, `CLEAR`,`DROP`, `ADD`, `MOVE`, `COPY`, `CREATE`. 

## Examples

#### Python (includes authentication)
```
import requests
# Authentication
login = requests.post('https://read-it.hum.uu.nl/rest-auth/login/',
                      data={'username': 'yourusername',
                            'password': 'yourpassword'})
key = login.json()['key']

# Update
q = 'INSERT DATA { <https://read-it.hum.uu.nl/nlp-ontology#content> a <http://www.w3.org/2000/01/rdf-schema#Class> }'
endpoint = 'https://read-it.hum.uu.nl/sparql/nlp-ontology/update'
response = requests.post(endpoint,
                         data={'update': q},
                         headers={'Authorization': 'Token {}'.format(key)})
succes_msg = response.text
print(succes_msg)
print(response.status_code)
```