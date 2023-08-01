FROM python:3.9-bullseye

WORKDIR /usr/src/app
COPY requirements.txt .
RUN pip install -U pip pip-tools && pip-sync

ARG DJANGO_SETTINGS_MODULE=readit.settings
COPY . .
RUN python manage.py migrate && python manage.py rdfmigrate

ENV DJANGO_SETTINGS_MODULE=$DJANGO_SETTINGS_MODULE
CMD python manage.py runserver
