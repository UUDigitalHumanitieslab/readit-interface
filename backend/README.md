## Preparing the database

```sql
create user readit with createdb;
create database readit;
grant all on database readit to readit;
```


## Initializing Django

```py
python manage.py migrate
python manage.py createsuperuser
```
