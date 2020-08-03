# READ-IT backend

Public interface for READ-IT

This is a server side web application based on [Django][1], [Django REST framework][2] (DRF) and [RDF][rdf]. Its primary purpose is to provide a JSON API with authentication and authorization, in order to support a separate frontend application.

[1]: https://www.djangoproject.com
[2]: https://www.django-rest-framework.org
[rdf]: https://www.w3.org/TR/rdf11-primer/


## Before you start

You need to install the following software:

 - PostgreSQL >= 9.3, client, server and C libraries
 - Python >= 3.4, <= 3.6
 - virtualenv
 - [Apache Jena Fuseki][fuseki] (see [notes](#notes-for-setting-up-fuseki) below) (requires Java)
 - WSGI-compatible webserver (deployment only)
 - [Visual C++ for Python][14] (Windows only)

[14]: https://wiki.python.org/moin/WindowsCompilers
[fuseki]: https://jena.apache.org/documentation/fuseki2/


### Notes for setting up Fuseki

The development settings included with this application assume that you have a Fuseki server running on port 3030 (the default) and that it hosts a dataset under the name `/readit`. The following steps suffice to make this true.

After downloading and extracting the [Fuseki binary distribution tarball][jena-download], `cd` into the extracted directory with the terminal. The following command will start an appropriate Fuseki server as a foreground process.

    ./fuseki-server --loc=/absolute/path/to/datadir --update --localhost /readit

You can set `/absolute/path/to/datadir` to any directory of your choosing, as long as the Fuseki process has read and write access to it. You likely want to create a new directory for this purpose.

While the Fuseki server is running, you can access its web interface at http://localhost:3030. This lets you upload and download data, try out queries and review statistics about the dataset. The server can be stopped by typing `ctrl-c`.

If you are new to Fuseki but not to READ-IT, i.e., you have previously deployed READ-IT version 0.4.0 or older, or done local development work on any commit that did not descend from `0063b21`, then you should also read the following section about migrating your triples from the rdflib-django store to Fuseki.

[jena-download]: https://jena.apache.org/download/


### Migrating triples from rdflib-django to Fuseki

*If you are setting up the READ-IT backend anew, you can skip this section.*

To copy pre-existing triples from the rdflib-django store to Fuseki, only a few commands are needed. Ensure that Fuseki is running and that your virtualenv is activated before you start.

First, open the interactive Django shell, for example with the following command.

```sh
$ python manage.py shell
```

In the interactive console, just two lines will do the trick:

```py
>>> from scripts.move_to_sparqlstore import move
>>> move()
```

### Setting up Elasticsearch
Download Elasticsearch 7 from the Elastic [website](https://www.elastic.co/downloads/elasticsearch). Optionally, also download [Kibana](https://www.elastic.co/downloads/kibana) (for easier index management). Unzip to a location of your choice. Navigate to the location of Elasticsearch and start with `bin/elasticsearch` (requires JAVA). This will start up the Elasticsearch server at `localhost:9200`. If you wish to use another port, you can set this in the Elasticsearch settings (`config/elasticsearch.yml`). In that case, adjust the settings in the `settings.py` document to use the correct port.

#### Set up an Elasticsearch index
Note: The following commands include localhost:9200. Omit everything until the first `/` after `PUT` or `POST` when using Kibana.


From Kibana, Postman, curl, or similar, create an index `readit-1` with the following mapping:
```
PUT localhost:9200/readit-1
{
  "mappings": {
    "properties": {
      "id": {"type": "keyword"},
      "language": {"type": "keyword"},
      "text": {"type": "text"},
      "text_en":  {
        "type": "text",
        "analyzer": "english"
      },
      "text_fr":  {
        "type": "text",
        "analyzer": "french"
      },
      "text_de":  {
        "type": "text",
        "analyzer": "german"
      },
      "text_nl":  {
        "type": "text",
        "analyzer": "dutch"
      }
    }
  }
}
```

Also add an alias named `readit`, like so:
```
POST localhost:9200/_aliases
{
    "actions" : [
        { "add" : { "index" : "readit-1", "alias" : "readit" } }
    ]
}
```

This will make sure that the id and languate will be saved. The source texts will be saved with standard analyzer in the `text` field, and depending on the source language, in a `text_{lang}` field with a language-specific analyzer.

Indexing and reading will be performed via the alias `readit`, which is set in `settings.py` as `ES_ALIASNAME`. The alias is used such that indices can be rolled over to a new version if necessary. Then the alias will have to be unset from the old index, and set to the new index.

#### Run the conversion script
If you have sources in the `media/sources` folder, you can add them to the Elasticsearch index with a conversion script as follows:
```
>>> from scripts.sources_to_elasticsearch import text_to_index
>>> text_to_index()
```

## How it works

The `readit` package is our "project" in Django jargon. It contains all central administration. The `settings`, `urls` and `wsgi` modules inside this package play the same roles as in any Django project. The `settings` module contains defaults that can be immediately used in development, but should be overridden in production. The `urls` module registers DRF [viewsets][3] besides the regular Django registrations.

[3]: https://www.django-rest-framework.org/api-guide/viewsets/

The `index` module contains a special view factory function which is meant to facilitate a client side application. It can generate views that always attempt to find a static HTML file with a particular name and return it as the response. Two views are generated in this way: `index`, which tries to respond with an `index.html`, and `specRunner`, which tries to respond with a `specRunner.html`. In the `urls` module, `specRunner` is configured to respond on the `/specRunner.html` path, but only in debug mode. The `index` view is configured as a global fallback route. The `index.html` should launch a client side (frontend) application that handles routing.

**Note:** this backend application doesn't—and *shouldn't*—contain a root `index.html` or `specRunner.html` in any of its static folders. Instead, you should add an external directory to Django's `STATICFILES_DIRS` setting which contains these files in its root, if you wish to combine this backend application with your frontend application of choice.

As in any Django application, you may add an arbitrary number of "application" (Django jargon) packages next to the `readit` package. Each "application" may contain its own `models` and `migrations`, as well as `admin`, `signals`, `validators`, `urls` etcetera. A `views` module may contain DRF [viewsets][3] instead of native Django views, in which case there should also be a [`serializers`][4] module which intermediates between the `models` and the `views`.

[4]: https://www.django-rest-framework.org/api-guide/serializers/

Unittest modules live directly next to the module they belong to. Each directory may contain a `conftest.py` with test fixtures available to all tests in the directory.

Data are stored in two places. The RDF triplestore contains the data of primary interest, i.e., sources, annotations and supporting concepts. The RDF data are segmented in several graphs, each represented by a separate Django application. The relational database takes care of user profiles, privileges and other bits of administration.

Each type of storage has its own way of describing the data model and of performing migrations. RDF is inherently self-describing, so the datamodel is stored alongside the data. Changes in the datamodel are performed using the `rdfmigrate` management command, which is implemented in our own `rdf` package.

The relational database follows the Django ORM conventions and can be migrated using the standard `migrate` command. The user list is however also exposed in RDF format, as if the users were stored in the triplestore. This facilitates linking annotations to users in RDF data.


## Development

### Quickstart

Create and activate a virtualenv. Ensure your working directory is the one that contains this README. Run the following commands as yourself (i.e., not in sudo mode nor with elevated privileges). You may need to [reconfigure PostgreSQL][5] and/or pass [additional arguments to `psql`][6] (in particular, your [own][7] PostgreSQL `dbname` and `username`) in order to be able to run the first command. You need to execute this sequence of commands only once after cloning the repository.

[5]: https://www.postgresql.org/docs/9.3/auth-pg-hba-conf.html
[6]: https://www.postgresql.org/docs/9.3/app-psql.html
[7]: https://www.postgresql.org/docs/9.3/database-roles.html

```console
$ psql -f create_db.sql
$ pip install pip-tools
$ pip install -r requirements.txt
$ python manage.py migrate
$ python manage.py rdfmigrate
$ python manage.py createsuperuser
```

We need to install `psycopg2` with the `--no-binary` flag [until version 2.8 of `psycopg2` is available][8]. If this were not the case, we could use `pip-sync` instead of `pip install -r`; the former currently doesn't work because of the `--no-binary` flag being present in the `requirements.txt`.

[8]: http://initd.org/psycopg/docs/install.html#disabling-wheel-packages-for-psycopg-2-7

If you are overriding the default settings, you may pass `--pythonpath` and `--settings` arguments to every invocation of `python manage.py`. `--settings` should be the name of the module (without `.py`) with your settings overrides. `--pythonpath` should be the path to the directory with your overridden settings module.


### Running the application (development server)

```console
$ python manage.py runserver
```

Once you see this line:

```console
Starting development server at http://127.0.0.1:8000/
```

you can visit http://localhost:8000/admin/ and http://localhost:8000/api/ in your browser of choice. If you attached an external frontend application, its main page will be at http://localhost:8000/ and its unittests will be at http://localhost:8000/specRunner.html.


### Enabling livereload

Run the following command in parallel with the development server:

```console
$ python manage.py livereload
```

This works for all Python modules, templates and static files that Django knows about. This also includes external directories that you may have added to the `STATICFILES_DIRS` setting. The `DEBUG` setting should be `True`, otherwise the livereload script is not inserted in HTML pages by the livereload middleware.


### Running the unittests

Run `pytest` to execute all tests once or `pytest --looponfail` to retest continuously as files change. Use the [pytest-django helpers][9] when writing new tests. pytest has all bells and whistles you may ever dream of; see the [documentation][10].

[9]: https://pytest-django.readthedocs.io/en/latest/helpers.html
[10]: https://docs.pytest.org/en/latest/


### Package management

When adding a new package to the requirements, it is recommended that you manually install it first and check that it works. Then, add the name of the package to the `requirements.in`. The entry should not include a version specification, unless you want to set an upper bound on the version. See the `django` entry for an example. After editing the `requirements.in`, run

```console
$ pip-compile
```

to update the `requirements.txt` with pinned versions of the package and all of its dependencies. Commit the changes to `requirements.in` and `requirements.txt` together to VCS.


## Deployment

Deployment is quite different from development. Please read the [Django documentation][11] and also the documentation of whatever webserver you are using. This section will only address some application specifics.

[11]: https://docs.djangoproject.com/en/1.11/howto/deployment/


### Overriding the settings

Make a copy of `readit/settings.py` and keep it out of reach from spying eyes. Change at least the following settings.

 - `BASE_DIR` should point to the directory containing this README.
 - `SECRET_KEY` should change to a different but equally long and random value. It is recommended that you use [`os.urandom`][12] for this.
 - `DEBUG` **must** be `False`.
 - `ALLOWED_HOSTS` should contain the hostname(s) on which you wish to serve your application. Just hostnames, e.g. `example.com` rather than `http://example.com:88`.
 - `DATABASES['default']['PASSWORD']` should change and should also be impractically hard to guess.
 - `STATIC_ROOT` should point to a directory where you want to collect all static files.

See also the [Django documentation][13].

[12]: https://docs.python.org/3/library/os.html#os.urandom
[13]: https://docs.djangoproject.com/en/1.11/ref/settings/


### Creating the database

You can follow the steps from `create_db.sql`, with two important differences:

 - The `createdb` permission is not needed in production, so you shouldn't include it.
 - The username, password and database name should be the same as the one in your settings overrides from the previous section.


### Configuring your webserver

How to configure your webserver is completely beyond the scope of this README. However, we can mention a few things to keep in mind:

 - Django will not serve static files in production mode. You need to configure the webserver to directly serve files from the `STATIC_ROOT` in your settings at the `STATIC_URL` in your settings.
 - Your webserver configuration should set environment variables or pass arguments to the WSGI application so it will use the settings overrides rather than the defaults from `readit/settings.py`.
