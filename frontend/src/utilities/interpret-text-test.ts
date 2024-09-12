import { each, map } from 'lodash';

import { xsd } from '../common-rdf/ns';
import Graph from '../common-rdf/graph';

import interpretText from './interpret-text';

function expectType(
    text: string, type: string,
    range: Graph = new Graph, alternatives?: string[]
): void {
    const { jsonld, ambiguous } = interpretText(text, range);
    expect(jsonld['@type']).withContext(text).toBe(type);
    if (arguments.length > 3) {
        expect(ambiguous).withContext(text).toEqual(alternatives);
    }
}

function expectValue(
    text: string, value: string, range: Graph = new Graph
): void {
    const { jsonld } = interpretText(text, range);
    expect(jsonld['@value']).withContext(text).toBe(value);
}

function idAsSubject(id: string) {
    return { '@id': id };
}

function makeRange(ids: string[]): Graph {
    return new Graph(map(ids, idAsSubject));
}

describe('interpretText utility', function() {
    it('can recognize most simple XSD types', function() {
        expectType(' ', xsd.string);
        expectType('.', xsd.string);
        expectType('-', xsd.string);
        expectType('banana', xsd.string);
        expectType('0', xsd.integer);
        expectType('-123.456', xsd.decimal);
        expectType('19e-24', xsd.double);
        expectType('true', xsd.boolean);
        expectType('false', xsd.boolean);
        expectType('2021Z', xsd.gYear);
        expectType('2021-08', xsd.gYearMonth);
        expectType('2021-08-25', xsd.date);
        expectType('--08-25', xsd.gMonthDay);
        expectType('--08', xsd.gMonth);
        expectType('---25', xsd.gDay);
        expectType('2021-08-25T18:01:43.123Z', xsd.dateTime);
        expectType('18:01:43.123Z', xsd.time);
        expectType('P34Y6M', xsd.duration);
        expectType('P2DT18H30.01S', xsd.duration);
        expectType('2fa3', xsd.hexBinary);
        expectType('eIu38ir+vA==', xsd.base64Binary);
    });

    it('provides information about ambiguities', function() {
        expectType('2021', xsd.hexBinary, undefined, [
            xsd.gYear, xsd.integer, xsd.base64Binary, xsd.string,
        ]);
        expectType('2fa3', xsd.hexBinary, undefined, [
            xsd.base64Binary, xsd.string,
        ]);
    });

    it('supports notations to disambiguate compatible types', function() {
        expectType('2021', xsd.hexBinary);
        expectType('2021Z', xsd.gYear);
        expectType('20 21', xsd.base64Binary);
        expectType(' 2021', xsd.string);
        expectType('02021', xsd.integer);
        expectType(' true', xsd.string);
    });

    it('trims leading spaces that were used to disambiguate', function() {
        expectValue(' ', '');
        expectValue(' 2021', '2021');
        expectValue(' true', 'true');
        expectValue(' en-US', 'en-US');
    });

    it('can restrict the available types to match', function() {
        const range = makeRange([xsd.integer, xsd.token]);
        expectType('0', xsd.integer, range);
        expectType('true', xsd.token, range);
        expectType('P2DT18H30.01S', xsd.token, range);
        expectType('2fa3', xsd.token, range);
        expectType('eIu38ir+vA==', xsd.token, range);
        expectType('2021', xsd.integer, range);
        expectType('2021Z', xsd.token, range);
        expectType('20 21', xsd.token, range);
        expectType(' 2021', xsd.token, range);
        expectType('02021', xsd.integer, range);
    });

    it('restricts information about ambiguities', function() {
        const range = makeRange([xsd.hexBinary, xsd.integer]);
        expectType('2021', xsd.hexBinary, range, [xsd.integer]);
        expectType('2fa3', xsd.hexBinary, range, []);
    });

    it('selects the widest available type', function() {
        const bits8 = makeRange([xsd.byte, xsd.unsignedByte, xsd.boolean]);
        expectType('130', xsd.unsignedByte, bits8);
        expectType('-6', xsd.byte, bits8);

        const bits32 = makeRange([xsd.float, xsd.int, xsd.unsignedInt]);
        expectType('130', xsd.int, bits32);
        expectType('-6', xsd.int, bits32);
        expectType('3000000000', xsd.unsignedInt, bits32);
        expectType('3e9', xsd.float, bits32);

        const signed = makeRange([xsd.byte, xsd.short, xsd.int, xsd.long]);
        expectType('130', xsd.long, signed);
        expectType('-6', xsd.long, signed);

        const unsigned = makeRange([
            xsd.unsignedByte, xsd.unsignedShort,
            xsd.unsignedInt, xsd.unsignedLong,
        ]);
        expectType('130', xsd.unsignedLong, unsigned);

        const keywords = makeRange([xsd.gMonth, xsd.boolean, xsd.language])
        expectType('1', xsd.boolean, keywords);
        expectType('en', xsd.language, keywords);
        expectType('en-US', xsd.language, keywords);
        expectType(' true', xsd.language, keywords);
    });

    it('returns undefined if no available type matches', function() {
        const range = makeRange([xsd.integer]);
        expectType('1', xsd.integer, range);
        expect(interpretText('abc', range)).toBeUndefined();
        expect(interpretText('true', range)).toBeUndefined();
        expect(interpretText('1e6', range)).toBeUndefined();
        expect(interpretText('aQ==', range)).toBeUndefined();
    });
});
