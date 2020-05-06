from re import compile

from rdflib import Literal

from rdf.migrations import RDFMigration, on_add, on_remove
from rdf.ns import RDF, OA
from . import namespace as my
from .graph import graph
from .fixture import canonical_graph

xpath_pattern = 'substring(.//*[{}]/text(), {})'
xpath_regex = compile(r'substring\(\.//\*\[(\d+)\]/text\(\), (\d+)\)')
webkit_chunk_size = 2**16  # 65536
has_value = RDF.value
is_a = RDF.type
has_start = OA.hasStartSelector
has_end = OA.hasEndSelector
is_start = OA.start
is_end = OA.end
position_selector = OA.TextPositionSelector


class Migration(RDFMigration):
    actual = staticmethod(graph)
    desired = staticmethod(canonical_graph)

    @on_add(my.chunkMarker)
    def normalize_xpath_character_indices(self, actual, conjunctive):
        xpath_selectors = conjunctive.quads((None, is_a, OA.XPathSelector))
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

    @on_remove(my.chunkMarker)
    def use_position_selectors(self, actual, conjunctive):
        # We re-purpose existing URIs of vocab:RangeSelectors and turn them into
        # oa:TextPositionSelectors. This has two main advantages: (1) it makes
        # it possible to continue the migration later if it breaks down the
        # middle for whatever reason and (2) it relieves us from fiddling with
        # serial numbers in order to generate new URIs.
        for quad in conjunctive.quads((None, is_a, my.RangeSelector)):
            selector, _, _, ctx = quad
            starts = find_character_positions(conjunctive, selector, ctx, True)
            ends = find_character_positions(conjunctive, selector, ctx, False)

            # Update the selector. Saving the position as a string when it is
            # zero is a workaround for a bug in rdflib_django which makes it
            # incapable of storing falsy literals.
            conjunctive.addN((
                selector, is_start, Literal(start or str(start)), ctx
            ) for start in starts)
            conjunctive.addN((
                selector, is_end, Literal(end or str(end)), ctx
            ) for end in ends)
            conjunctive.add((selector, is_a, position_selector, ctx))

            # Finally, remove the quad that we started with to prevent
            # repetition.
            conjunctive.remove(quad)


def find_character_positions(conjunctive, selector, ctx, start):
    """
    Return the character indices for a given side of `range` within `context`.

    If `start`, return the character indices of start selectors, otherwise of
    end selectors. Should generally return a list of length 1.
    """
    side = start and has_start or has_end
    indices = []
    for _, _, sideSel, _ in conjunctive.quads((selector, side, None, ctx)):
        side_value_pattern = (sideSel, has_value, None, ctx)
        for _, _, value, _ in conjunctive.quads(side_value_pattern):
            match = xpath_regex.match(str(value))
            if not match: continue
            _, index = map(int, match.groups())
            indices.append(index)
    return indices
