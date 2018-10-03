## Preparing the database

```sql
create user readit with createdb;
create database readit;
grant all on database readit to readit;
```


## Installing the packages

```console
$ pip install pip-tools psycopg2 --no-binary psycopg2
$ pip-sync
```

We need to install `psycopg2` with the `--no-binary` flag until we can upgrade to version 2.8 of `psycopg2`.


## Initializing Django

```console
$ python manage.py migrate
$ python manage.py createsuperuser
```


## Testing

Run `pytest` to execute all tests. Use the [pytest-django helpers][1] when writing new tests. **Don't** write tests in the way described in the Django tutorial.

[1]: https://pytest-django.readthedocs.io/en/latest/helpers.html
