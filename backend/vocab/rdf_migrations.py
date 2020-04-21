from re import compile

from rdflib import Literal

from rdf.migrations import RDFMigration, on_add
from rdf.ns import RDF, OA
from . import namespace as my
from .graph import graph
from .fixture import canonical_graph

xpath_pattern = 'substring(.//*[{}]/text(), {})'
xpath_regex = compile(r'substring\(\.//\*\[(\d+)\]/text\(\), (\d+)\)')
webkit_chunk_size = 2**16  # 65536
has_value = RDF.value


class Migration(RDFMigration):
    actual = staticmethod(graph)
    desired = staticmethod(canonical_graph)

    @on_add(my.chunkMarker)
    def normalize_xpath_character_indices(self, actual, conjunctive):
        xpath_selectors = conjunctive.quads((None, RDF.type, OA.XPathSelector))
        for s, p, o, c in xpath_selectors:
            # Note that c will tend to be the /item/ graph.
            value_quads = list(conjunctive.quads((s, has_value, None, c)))
            # len(value_quads) should be exactly 1, but in order to ensure that
            # the migration will still work in the face of faulty data, we do
            # not verify or enforce this.
            for quad in value_quads:
                value = str(quad[2])  # object position
                match = xpath_regex.match(value)
                if not match: continue  # this *should* never happen
                nodeIndex, charIndex = map(int, match.groups())
                if nodeIndex == 0: continue  # no fix required
                normIndex = (nodeIndex * webkit_chunk_size) + charIndex
                normalized_xpath = Literal(xpath_pattern.format(0, normIndex))
                conjunctive.add((s, has_value, normalized_xpath, c))
                conjunctive.remove(quad)
