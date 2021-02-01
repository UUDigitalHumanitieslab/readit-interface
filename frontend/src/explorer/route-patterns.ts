export default {
    'source:bare':            'explore/source/:serial',
    'source:annotated':       'explore/source/:serial/annotations',
    'annotation':             'explore/source/:serial/annotations/:serial',
    'annotation:edit':        'explore/source/:serial/annotations/:serial/edit',
    'item':                   'explore/item/:serial',
    'item:edit':              'explore/item/:serial/edit',
    'item:related':           'explore/item/:serial/related',
    'item:related:edit':      'explore/item/:serial/related/edit',
    'item:external':          'explore/item/:serial/external',
    'item:external:edit':     'explore/item/:serial/external/edit',
    'item:annotations':       'explore/item/:serial/annotations',
    'search:results:sources': 'explore/sources?*queryParams',
};
