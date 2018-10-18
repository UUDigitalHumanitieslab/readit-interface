""" This is magic glue for integrating the frontend and backend.

    This is NOT the place for backend customizations. Go to
    api/readit/settings.py instead.
"""

import os.path as op

here = op.dirname(op.abspath(__file__))

# First, import the standard backend settings. This requires some
# magic because the backend directory itself is not a Python package.
# Imitated from https://docs.python.org/3/library/importlib.html#importing-a-source-file-directly

import sys
from importlib import util

settings_name = 'settings'
settings_path = op.join(here, 'backend', 'readit', 'settings.py')
spec = util.spec_from_file_location(settings_name, settings_path)
settings = util.module_from_spec(spec)
spec.loader.exec_module(settings)
sys.modules[settings_name] = settings

from settings import *

# Next, augment the settings to make the backend aware of the frontend.

STATICFILES_DIRS += [
    op.join(here, 'frontend', 'dist'),
    op.join(here, 'frontend', 'node_modules'),
]
