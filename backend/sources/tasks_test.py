from rdflib import Graph, URIRef

from rdf.ns import *

from .constants import *
from .tasks import replace_bnodes
from ontology.fixture import replace_prefix

test_output = '@prefix ns1: <http://www.w3.org/ns/oa#> .\n@prefix ns2: <http://www.w3.org/ns/activitystreams#> .\n@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .\n\n[] a ns1:Annotation ;\n    ns2:generator <https://allgo18.inria.fr/apps/read_it_test> ;\n    ns1:hasBody <https://read-it.hum.uu.nl/nlp-ontology#person> ;\n    ns1:hasTarget [ a ns1:SpecificResource ;\n            ns1:hasSelector [ a ns1:TextPositionSelector ;\n                    ns1:end 233 ;\n                    ns1:start 220 ],\n                [ a ns1:TextQuoteSelector ;\n                    ns1:exact "Bilbo Baggins" ;\n                    ns1:prefix "everyday deeds of ordinary folk that keep the darkness at bay. Small acts of kindness and love. Why " ;\n                    ns1:suffix "? Perhaps because I am afraid, and he gives me courage." ] ;\n            ns1:hasSource <readit-test.url/source/42> ] .\n\n[] a ns1:Annotation ;\n    ns2:generator <https://allgo18.inria.fr/apps/read_it_test> ;\n    ns1:hasBody <https://read-it.hum.uu.nl/nlp-ontology#person> ;\n    ns1:hasTarget [ a ns1:SpecificResource ;\n            ns1:hasSelector [ a ns1:TextQuoteSelector ;\n                    ns1:exact "Saruman" ;\n                    ns1:prefix "" ;\n                    ns1:suffix " believes it is only great power that can hold evil in check, but that is not what I have found. It " ],\n                [ a ns1:TextPositionSelector ;\n                    ns1:end 7 ;\n                    ns1:start 0 ] ;\n            ns1:hasSource <readit-test.url/source/42> ] .\n\n\n'
TEST_NS = 'test/nlp-ontology'

nlp_reference = 'https://read-it.hum.uu.nl/nlp-ontology#person'


def test_replace_bnodes(sourcegraphdb):
    g = Graph()
    g.parse(data=test_output, format='turtle')
    new_graph = replace_bnodes(g)
    assert len(list(g.subjects())) == len(list(new_graph.subjects()))
    assert not new_graph.value(
        predicate=OA.hasBody, object=URIRef(nlp_reference))
