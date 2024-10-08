# READ-IT

Public interface for READ-IT


## Before you start

You need to install the following software (unless you use Docker):

 - PostgreSQL >= 9.3, client, server and C libraries
 - Python >= 3.8
 - virtualenv
 - [Blazegraph][blazegraph] (see [notes in the backend README](backend/README.md#notes-for-setting-up-blazegraph))
 - Elasticsearch 8 (see [notes in the backend README](backend/README.md#setting-up-elasticsearch))
 - RabbitMQ or other message broker and Celery (see [notes](backend/README.md#setting-up-celery))
 - WSGI-compatible webserver (deployment only)
 - [Visual C++ for Python][1] (Windows only)
 - Node.js >= 8
 - Yarn
 - [WebDriver][2] for at least one browser (only for functional testing)

[1]: https://wiki.python.org/moin/WindowsCompilers
[2]: https://pypi.org/project/selenium/#drivers
[blazegraph]: https://blazegraph.com/


## How it works

This project integrates three isolated subprojects, each inside its own subdirectory with its own code, package dependencies and tests:

 - `backend`, the server side web application based on [Django][3] and [DRF][4];
 - `frontend`, the client side web application based on [Backbone][5];
 - `functional-tests`, the functional test suite based on [Selenium][6] and [pytest][7].

[3]: https://www.djangoproject.com
[4]: https://www.django-rest-framework.org
[5]: https://backbonejs.org
[6]: https://www.seleniumhq.org/docs/03_webdriver.jsp
[7]: https://docs.pytest.org/en/latest/

Each subproject is configurable from the outside. Integration is achieved using "magic configuration" which is contained inside the root directory together with this README. In this way, the subprojects can stay truly isolated from each other.

If you are reading this README, you'll likely be working with the integrated project as a whole rather than with one of the subprojects in isolation. In this case, this README should be your primary source of information on how to develop or deploy the project. However, we recommend that you also read the "How it works" section in the README of each subproject.


## Development

### Quickstart, Docker

First time after cloning this project:

```console
$ docker-compose up -d blazegraph elastic
```

Wait a bit until both services are ready, then follow the instructions in the sections [Setting up Blazegraph namespaces][bg-ns] and [Set up an Elasticsearch index][es-ix] in the backend README.

[bg-ns]: backend/README.md#setting-up-blazegraph-namespaces
[es-ix]: backend/README.md#set-up-an-elasticsearch-index

From then on, you can always start the full application (backend and frontend with supporting services) with the following command:

```console
$ docker-compose up -d
```

The first time, this will take relatively long. To create a superuser account, run this once while the `backend` service is up:

```console
$ docker-compose exec backend python manage.py createsuperuser
```

Data will persist between runs. You can visit the frontend on http://localhost:8000/, the browsable backend API on http://localhost:8000/api/ and the backend admin on http://localhost:8000/admin/.

To run and debug the frontend tests, visit http://localhost:8000/specRunner.html. For the backend tests, use something along the lines of the following command while the `backend` service is up:

```console
docker-compose exec backend pytest
```

or use `run` instead of `exec` for a one-off container, `bash` instead of `pytest` if you want to run multiple commands, etcetera. You can also pass the usual flags to `pytest` such as `--looponfail`, `--pdb` and `--trace`; see the [pytest docs][7] or `pytest --help` for details.

There is no dockerized way to run the functional test suite yet. However, you could install its dependencies in a virtualenv and then run the test suite from the host machine while the application is running in Docker.


### Quickstart, non-Docker

First time after cloning this project:

```console
$ python bootstrap.py
```

Running the application in [development mode][8] (hit ctrl-C to stop):

```console
$ yarn start
```

This will run the backend and frontend applications, as well as their unittests, and watch all source files for changes. You can visit the frontend on http://localhost:8000/, the browsable backend API on http://localhost:8000/api/ and the backend admin on http://localhost:8000/admin/. On every change, unittests rerun, frontend code rebuilds and open browser tabs refresh automatically (livereload).

For live debugging of the frontend unittests, visit http://localhost:8000/specRunner.html. For live debugging of the backend unittests, run `yarn watch-test-back` and either manually set a breakpoint using your editor, pass `--pdb` to automatically break into the debugger when a test fails or pass `--trace` to automatically break into the debugger at the start of each test. In the latter case, you probably want to pass additional arguments to restrict which tests will be run. You can also combine these options.

[8]: #development-mode-vs-production-mode

To temporarily work only on the backend or frontend, respectively, run

```console
# backend
$ yarn start-back
# frontend
$ yarn gulp
```

In the former case, please note that there is no index page; you need to go directly to http://localhost:8000/admin/ etcetera. Obviously, there is no `specRunner.html`, either. In the latter case, the port number is `8080` instead of `8000` and the unittests are at http://localhost:8080/static/specRunner.html. Of course, backend pages like `/admin/` don’t exist in this case.


### Recommended order of development

For each new feature, we suggested that you work through the steps listed below. This could be called a back-to-front or "bottom up" order. Of course, you may have reasons to choose otherwise. For example, if very precise specifications are provided, you could move step 8 to the front for a more test-driven approach.

Steps 1–5 also include updating the unittests. Only functions should be tested, especially critical and nontrivial ones.

 1. Backend model changes including migrations.
 2. Backend serializer changes and backend admin changes.
 3. Backend API endpoint changes.
 4. Frontend model changes.
 5. Other frontend unit changes (templates, views, routers, FSMs).
 6. Frontend integration (globals, event bindings).
 7. Run functional tests, repair broken functionality and broken tests.
 8. [Add functional tests][9] for the new feature.
 9. Update technical documentation.

[9]: functional-tests/README.md#writing-tests

For release branches, we suggest the following checklist.

 1. Bump the version number in the `package.json` next to this README.
 2. Run the functional tests in production mode, fix bugs if necessary.
 3. Try using the application in production mode, look for problems that may have escaped the tests.
 4. Add regression tests (unit or functional) that detect problems from step 3.
 5. Work on the code until new regression tests from step 4 pass.
 6. Optionally, repeat steps 2–5 with the application running in a real deployment setup (see [Deployment](#deployment)).


### Commands for common tasks, Docker

After switching branches, changing backend dependencies, editing either `Dockerfile` or editing the `docker-compose.yml`:

```console
$ docker-compose up -d --build
```

Backend management commands follow the following pattern:

```console
$ docker-compose exec backend COMMAND [OPTIONS ...]
```

where `COMMAND` will typically be one of `pip-compile`, `python manage.py`, `django-admin` or `pytest`. All of these commands accept `--help` as an option. **However,** the `python manage.py dbshell` subcommand does not work because the backend container is based on an image that does not have `psql` installed. Instead, you can use the following, equivalent command:

```console
$ docker-compose exec postgres psql readit readit
```

Similar patterns apply to the `celery` service, where the command will typically look like this:

```console
$ docker-compose exec celery celery -A readit SUBCOMMAND
```

and to the frontend, where the command will typically look as below,

```console
$ docker-compose exec frontend yarn SUBCOMMAND
```

where `SUBCOMMAND` will most likely be `add`, `remove`, `upgrade` or `gulp`. To extract the translation strings, follow `yarn` by `i18next -c i18next-parser.config.mjs`.


### Commands for common tasks, non-Docker

The `package.json` next to this README defines several shortcut commands to help streamline development. In total, there are over 30 commands. Most may be regarded as implementation details of other commands, although each command could be used directly. Below, we discuss the commands that are most likely to be useful to you. For full details, consult the `package.json`.

Install the pinned versions of all package dependencies in all subprojects:

```console
$ yarn
```

Run backend and frontend in [production mode][8]:

```console
$ yarn start-p
```

Run the functional test suite:

```console
$ yarn test-func [FUNCTIONAL TEST OPTIONS]
```

The functional test suite by default assumes that you have the application running locally in production mode (i.e., on port `8080`). See [Configuring the browsers][10] and [Configuring the base address][11] in `functional-tests/README` for options.

[10]: functional-tests/README.md#configuring-the-browsers
[11]: functional-tests/README.md#configuring-the-base-address

Run *all* tests (mostly useful for continuous integration):

```console
$ yarn test [FUNCTIONAL TEST OPTIONS]
```

Run an arbitrary command from within the root of a subproject:

```console
$ yarn back  [ARBITRARY BACKEND COMMAND HERE]
$ yarn front [ARBITRARY FRONTEND COMMAND HERE]
$ yarn func  [ARBITRARY FUNCTIONAL TESTS COMMAND HERE]
```

For example,

```console
$ yarn back less README.md
```

is equivalent to

```console
$ cd backend
$ less README.md
$ cd ..
```

Run `python manage.py` within the `backend` directory:

```console
$ yarn django [SUBCOMMAND] [OPTIONS]
```

`yarn django` is a shorthand for `yarn back python manage.py`. This command is useful for managing database migrations, among other things.

Manage the frontend package dependencies:

```console
$ yarn fyarn (add|remove|upgrade|...) (PACKAGE ...) [OPTIONS]
```

Run [frontend Gulp commands][12]:

```console
$ yarn gulp [SUBCOMMAND ...] [OPTIONS]
```

[12]: frontend/README.md#gulp-tasks-and-options

Extract translation strings in the frontend:

```console
$ yarn localize
```


### Notes on Python package dependencies

***Docker note:*** *this section does not apply if you run the application in Docker, except that you should edit the `requirements.in` prior to calling `pip-compile`.*

Both the backend and the functional test suite are Python-based and package versions are pinned using [pip-tools][13] in both subprojects. For ease of development, you most likely want to use the same virtualenv for both and this is also what the `bootstrap.py` assumes.

[13]: https://pypi.org/project/pip-tools/

This comes with a small catch: the subprojects each have their own separate `requirements.txt`. If you run `pip-sync` in one subproject, the dependencies of the other will be uninstalled. In order to avoid this, you run `pip install -r requirements.txt` instead. The `yarn` command does this correctly by default.

Another thing to be aware of, is that `pip-compile` takes the old contents of your `requirements.txt` into account when building the new version based on your `requirements.in`. You can use the following trick to keep the requirements in both projects aligned so the versions of common packages don't conflict:

```console
$ yarn back pip-compile
# append contents of backend/requirements.txt to functional-tests/requirements.txt
$ yarn func pip-compile
```


### Development mode vs production mode

***Docker note:*** *`docker-compose up` always runs the application in development mode.*

The purpose of development mode is to facilitate live development, as the name implies. The purpose of production mode is to simulate deployment conditions as closely as possible, in order to check whether everything still works under such conditions. A complete overview of the differences is given below.

dimension  |  Development mode  |  Production mode
-----------|--------------------|-----------------
command  |  `yarn start`  |  `yarn start-p`
base address  |  http://localhost:8000  |  http://localhost:8080
backend server (Django)  |  in charge of everything  |  serves backend only
frontend server (gulp-connect)  |  does not run  |  primary gateway
static files  |  served directly by Django's staticfiles app  |  collected by Django, served by gulp-connect
backend `DEBUG` setting  |  `True`  |  `False`
backend `ALLOWED_HOSTS`  |  -  |  restricted to `localhost`
livereload  |  yes  |  no
frontend sourcemaps  |  yes  |  no
frontend optimization  |  no  |  yes
HTML embedded libraries  |  taken from `frontend/node_modules`  |  taken from CDN


## Deployment

***Docker note:*** *The current Docker setup does not cater to deployment yet.*

Both the backend and frontend applications have a section dedicated to deployment in their own READMEs. You should read these sections entirely before proceeding. All instructions in these sections still apply, though it is good to know that you can use the following shorthand commands from the integrated project root:

```console
# build the frontend with overridden settings
$ yarn gulp dist --production --config path/to/your/config-override.json
# collect static files of both backend and frontend, with overridden settings
$ yarn django collectstatic --settings SETTINGS --pythonpath path/to/SETTINGS.py
```

You should execute these commands in the order shown, i.e., build the frontend before collecting all static files.
