import re
from rdflib import Graph
from .constants import (SOURCE_FORMAT, SOURCE_ONTOLOGY_FILE,
                        SOURCE_ONTOLOGY_NS, SOURCE_PREFIX)


def canonical_graph():
    with open(SOURCE_ONTOLOGY_FILE) as f:
        content = f.read()
        replaced_source = re.sub(
            r'{}'.format(SOURCE_PREFIX), SOURCE_ONTOLOGY_NS, content)
        g = Graph()
        g.parse(data=replaced_source, format=SOURCE_FORMAT)
        return g
