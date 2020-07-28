""" This is magic glue for integrating the frontend and backend.

    This is NOT the place for backend customizations. Go to
    api/readit/settings.py instead.
"""

import os.path as op

here = op.dirname(op.abspath(__file__))

# First, import the standard backend settings. This requires some
# magic because the backend directory itself is not a Python package.
# Imitated from https://docs.python.org/3/library/importlib.html#importing-a-source-file-directly
# or
# https://stackoverflow.com/a/29855240
# (respectively for Python >= 3.5 and Python 3.4)

import sys
from importlib import util, machinery

settings_name = 'settings'
settings_path = op.join(here, 'backend', 'readit', 'settings.py')

if sys.version_info >= (3, 5):
    spec = util.spec_from_file_location(settings_name, settings_path)
    settings = util.module_from_spec(spec)
    spec.loader.exec_module(settings)
else:
    settings = machinery.SourceFileLoader(settings_name, settings_path).load_module()

sys.modules[settings_name] = settings

TESTRUNNER_FILE_PATH = 'specRunner.html'

import settings

settings.TESTRUNNER_FILE_PATH = TESTRUNNER_FILE_PATH

# Next, augment the settings to make the backend aware of the frontend.

from settings import *

STATICFILES_DIRS += [
    op.join(here, 'frontend', 'dist'),
    op.join(here, 'frontend', 'node_modules'),
]
