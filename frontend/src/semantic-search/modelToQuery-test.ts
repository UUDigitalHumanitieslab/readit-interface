import { each } from 'lodash';

import { startStore, endStore } from '../test-util';
import mockOntology from '../mock-data/mock-ontology';

import Model from '../core/model';
import Collection from '../core/collection';
import { rdf, rdfs, owl, xsd, readit } from '../common-rdf/ns';
import Node from '../common-rdf/node';
import Graph from '../common-rdf/graph';

import modelToQuery, {
    serializeIri,
    serializeLiteral,
    serializePredicate,
    serializeExpression,
    combineAnd,
    combineOr,
} from './modelToQuery';

describe('semantic search query serialization', function() {
    beforeEach(startStore);
    beforeEach(function() {
        this.ontology = new Graph(mockOntology);
    });
    afterEach(endStore);

    describe('serializeIri', function() {
        it('puts an IRI between angle brackets by default', function() {
            expect(serializeIri(rdfs.range, {})).toBe(`<${rdfs.range}>`);
        });

        it('applies a namespace abbreviation when available', function() {
            expect(serializeIri(rdfs.range, { r: rdfs() })).toBe('r:range');
        });

        it('ignores irrelevant namespaces', function() {
            expect(serializeIri(rdfs.range, {
                o: owl(),
            })).toBe(`<${rdfs.range}>`);
            expect(serializeIri(rdfs.range, {
                r: rdfs(),
                o: owl(),
            })).toBe('r:range');
        });
    });

    describe('serializeLiteral', function() {
        it('serializes numbers', function() {
            expect(serializeLiteral('123', xsd.integer, {})).toBe('123');
            expect(serializeLiteral('12.3', xsd.decimal, {})).toBe('12.3');
            expect(serializeLiteral('.123', xsd.double, {})).toBe('.123');
        });

        it('serializes strings', function() {
            expect(serializeLiteral('abc', xsd.string, {})).toBe('"abc"');
        });

        it('serializes dates', function() {
            expect(
                serializeLiteral('2021-06-01', xsd.dateTime, {})
            ).toBe(`"2021-06-01"^^<${xsd.dateTime}>`);
            expect(
                serializeLiteral('2021-06-01', xsd.dateTime, { x: xsd() })
            ).toBe('"2021-06-01"^^x:dateTime');
        });
    });

    describe('serializePredicate', function() {
        beforeEach(function() {
            this.property = this.ontology.find({'@type': rdf.Property});
            expect(this.property).toBeDefined();
        });

        it('behaves like serializeIri for direct properties', function() {
            const pr = this.property;
            const id = pr.id;
            each([{}, {r: readit()}], function(ns) {
                expect(serializePredicate(pr, ns)).toBe(serializeIri(id, ns));
            });
        });

        it('uses caret notation for inverse properties', function() {
            const pr = this.property;
            const id = pr.id;
            const inv = new Node({ [owl.inverseOf]: pr });
            each([{}, {r: readit()}], function(ns) {
                expect(serializePredicate(inv, ns))
                    .toBe(`^${serializeIri(id, ns)}`);
            });
        });
    });

    describe('serializeExpression', function() {
        it('supports binary operator expressions', function() {
            const filter = new Model({ operator: '+' });
            const args = ['1', '2'];
            expect(serializeExpression(filter, args).expression)
                .toBe('(1 + 2)');
        });

        it('supports unary function calls', function() {
            const filter = new Model({ function: 'testme' });
            const args = ['"abc"'];
            expect(serializeExpression(filter, args).expression)
                .toBe('testme("abc")');
        });

        it('supports binary function calls', function() {
            const filter = new Model({ function: 'testme' });
            const args = ['1', '2'];
            expect(serializeExpression(filter, args).expression)
                .toBe('testme(1, 2)');
        });
    });

    describe('combineAnd', function() {
        it('joins expressions', function() {
            expect(combineAnd({ expression: [{
                tag: 'expression',
                expression: '(1 < 2)',
            }, {
                tag: 'expression',
                expression: '(3 < 4)',
            }]})).toEqual({
                tag: 'expression',
                expression: '((1 < 2) && (3 < 4))',
            });
        });

        it('joins patterns', function() {
            expect(combineAnd({ pattern: [{
                tag: 'pattern',
                pattern: '?a ?b ?c.\n',
            }, {
                tag: 'pattern',
                pattern: '?d ?e ?f.\n',
            }]})).toEqual({
                tag: 'pattern',
                pattern: '?a ?b ?c.\n?d ?e ?f.\n',
            });
        });

        it('joins mixtures of patterns and expressions', function() {
            expect(combineAnd({ expression: [{
                tag: 'expression',
                expression: '(1 < 2)',
            }], pattern: [{
                tag: 'pattern',
                pattern: '?a ?b ?c.\n',
            }]})).toEqual({
                tag: 'pattern',
                pattern: '?a ?b ?c.\nFILTER (1 < 2)\n',
            });
        });
    });

    describe('combineOr', function() {
        it('joins expressions', function() {
            expect(combineOr({ expression: [{
                tag: 'expression',
                expression: '(1 < 2)',
            }, {
                tag: 'expression',
                expression: '(3 < 4)',
            }]})).toEqual({
                tag: 'expression',
                expression: '((1 < 2) || (3 < 4))',
            });
        });

        it('joins patterns', function() {
            expect(combineOr({ pattern: [{
                tag: 'pattern',
                pattern: '?a ?b ?c.\n',
            }, {
                tag: 'pattern',
                pattern: '?d ?e ?f.\n',
            }]})).toEqual({
                tag: 'pattern',
                pattern: '{\n?a ?b ?c.\n} UNION {\n?d ?e ?f.\n}\n',
            });
        });

        it('joins mixtures of patterns and expressions', function() {
            expect(combineOr({ expression: [{
                tag: 'expression',
                expression: '(1 < 2)',
            }], pattern: [{
                tag: 'pattern',
                pattern: '?a ?b ?c.\n',
            }]})).toEqual({
                tag: 'expression',
                expression: '((1 < 2) || EXISTS {\n?a ?b ?c.\n})',
            });
        });
    });
});
