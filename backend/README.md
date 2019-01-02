## Preparing the database

```sql
create user readit with createdb with password 'readit';
create database readit;
grant all on database readit to readit;
```


## Installing the packages

```console
$ pip install pip-tools
$ pip install -r requirements.txt
```

We need to install `psycopg2` with the `--no-binary` flag until we can upgrade to version 2.8 of `psycopg2`. If this were not the case, we could use `pip-sync` instead of `pip install -r`; the former currently doesn't work because of the `--no-binary` flag being present in the `requirements.txt`.


## Initializing Django

```console
$ python manage.py migrate
$ python manage.py createsuperuser
```


## Testing

Run `pytest` to execute all tests once or `pytest --looponfail` to retest continuously as files change. Use the [pytest-django helpers][1] when writing new tests. **Don't** write tests in the way described in the Django tutorial.

[1]: https://pytest-django.readthedocs.io/en/latest/helpers.html


## Livereload

```console
$ python manage.py livereload
```

This works for all Python modules, templates and static files that Django knows about. If the `DEBUG` setting is `True`, the livereload script is automatically inserted in HTML pages.
