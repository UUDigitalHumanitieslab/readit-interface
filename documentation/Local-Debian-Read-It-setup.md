This is a recipe for installing Read-It on Debian 10 Buster. It uses [Linux containers via LXD](https://linuxcontainers.org/lxd/getting-started-cli/) to keep things isolated from the host system, or you can skip the LXD part and move to installing the prerequisites. Modify as needed.

# LXD Container setup

Install LXD, add your user to the `lxd` group, and setup LXD with `lxd init`.

Refresh group membership by logging out and back in (or via `su - yourname`). Then:

    lxc launch images:debian/10 Readit
    lxc start Readit

Login as root:

`lxc exec Readit -- /bin/bash`

In the Debian container:

    apt-get install sudo
    adduser yourname
    usermod -aG sudo yourname

Copy files you need into the container. For example:

`lxc file push -r ~/.ssh Readit/home/yourname/`

Login as user `yourname`:

`lxc exec Readit -- su --login yourname`

Proxy container ports that you want to be available on your host system:

    lxc config device add Readit postgresport proxy listen=tcp:0.0.0.0:5433 connect=tcp:127.0.0.1:5432
    lxc config device add Readit elasticport proxy listen=tcp:0.0.0.0:9201 connect=tcp:127.0.0.1:9200
    lxc config device add Readit fuseki proxy listen=tcp:0.0.0.0:3030 connect=tcp:127.0.0.1:3030
    lxc config device add Readit mainApp proxy listen=tcp:0.0.0.0:8000 connect=tcp:127.0.0.1:8000

# Install prerequisites on Debian 10

As root:

`apt-get install wget curl git git-flow ssh nano vim gnupg apt-transport-https lsb-release unzip python3 python3-pip pkg-config postgresql postgresql-client libpq-dev openjdk-11-jre`

Notes:

- Fuseki lists Java8 requirement, but `openjdk-11-jre` which is available by default seems to work fine.
- This installs the default version of `python3` available for Debian 10, which is 3.7 rather than 3.6, but this seems to work as well for Read-It.

## Configure PostgreSQL

    systemctl status postgresql.service
    systemctl start postgresql.service
    passwd postgres

Allow to login to PostgreSQL with role `postgres` from your `yourname` account:

`nano /etc/postgresql/11/main/pg_ident.conf`:

    yourname_postgres  postgres                postgres
    yourname_postgres  yourname                postgres

`nano /etc/postgresql/11/main/pg_hba.conf`:

> local   all             postgres                                peer map=yourname_postgres

`systemctl restart postgresql`

Check that you can login as `postgres` from `yourname`:

`psql -U postgres`

Set a postgres role password (for TCP port-based connections):

postgres=# `\password`

## Install virtualenv:

`pip3 install virtualenv`

Make sure ~/.local/bin is on the PATH for virtualenv:

`source ~/.profile`

## Install ElasticSearch:

    wget -qO - https://artifacts.elastic.co/GPG-KEY-elasticsearch | apt-key add -
    echo "deb https://artifacts.elastic.co/packages/7.x/apt stable main" > /etc/apt/sources.list.d/elastic-7.x.list
    apt-get update && apt-get install elasticsearch

`systemctl start elasticsearch`

Check the installation:

`curl http://127.0.0.1:9200`

## Install NodeJS and NPM:

    curl -sL https://deb.nodesource.com/setup_14.x | bash -
    apt-get install nodejs
    nodejs --version
    npm --version

## Install Yarn:

    curl -sL https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add -
    echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list
    apt-get update && apt-get install yarn

## Install Chrome

    wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
    apt-get install ./google-chrome-stable_current_amd64.deb
    
    CHROME_MAIN_VERSION=`google-chrome-stable --version | sed -E 's/(^Google Chrome |\.[0-9]+ )//g'
    CHROMEDRIVER_VERSION=`curl -s "https://chromedriver.storage.googleapis.com/LATEST_RELEASE_$CHROME_MAIN_VERSION"
    curl "https://chromedriver.storage.googleapis.com/${CHROMEDRIVER_VERSION}/chromedriver_linux64.zip" -O
    unzip chromedriver_linux64.zip -d /usr/local/bin

# Install Fuseki

As non-root `yourname` account:

    mkdir -p ~/.local/bin
    wget https://mirror.serverion.com/apache/jena/binaries/apache-jena-fuseki-3.17.0.tar.gz -O - | tar xz -C ~/.local/bin

# Setup Read-It

Follow the steps as described in the READMEs. For a quick development setup: 

- Create an ElasticSearch index [as described here](https://github.com/UUDigitalHumanitieslab/readit-interface/blob/develop/backend/README.md#setting-up-elasticsearch).

- Run Fuseki:

        mkdir ~/readit_data
        ~/.local/bin/apache-jena-fuseki-3.17.0/fuseki-server --loc=/home/yourname/readit_data --update --localhost /readit

    - At http://localhost:3030/manage.html, add a dataset named `readit-test`

- Download and install -- basically:

        git clone git@github.com:UUDigitalHumanitieslab/readit-interface.git
        cd readit-interface
        python bootstrap.py # Use "psql -U postgres" as psql prompt

- `yarn start` (development mode)