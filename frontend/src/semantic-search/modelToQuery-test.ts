import { each, times, uniqueId } from 'lodash';

import { startStore, endStore } from '../test-util';
import mockOntology from '../mock-data/mock-ontology';

import Model from '../core/model';
import Collection from '../core/collection';
import { rdf, rdfs, owl, xsd, readit, item } from '../common-rdf/ns';
import Subject from '../common-rdf/subject';
import Graph from '../common-rdf/graph';

import modelToQuery, {
    serializeIri,
    serializeLiteral,
    serializePredicate,
    serializeExpression,
    combineAnd,
    combineOr,
    serializeChain,
} from './modelToQuery';

function predictVariables(count: number): string[] {
    const start = 1 + +uniqueId();
    return times(count, offset => `?x${start + offset}`);
}

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
            const inv = new Subject({ [owl.inverseOf]: pr });
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

    describe('serializeChain', function() {
        const ns = {
            r: rdfs(),
            o: owl(),
            rit: readit(),
        };

        it('handles the most trivial case', function() {
            expect(serializeChain(new Model({
                chain: new Collection([{
                    scheme: 'filter',
                    filter: new Model({ function: 'isIri' }),
                    range: new Graph([{ '@id': rdfs.range }]),
                }]),
            }), '?a', ns)).toEqual({
                tag: 'expression',
                expression: 'isIri(?a)',
            });
        });

        it('can pick up from the middle', function() {
            expect(serializeChain(new Model({
                chain: new Collection([{
                    range: new Graph([{ '@id': rdfs.range }]),
                    traversal: true,
                    selection: this.ontology.first(),
                }, {
                    scheme: 'filter',
                    filter: new Model({ function: 'isIri' }),
                    range: new Graph([{ '@id': rdfs.range }]),
                }]),
            }), '?a', ns, 1)).toEqual({
                tag: 'expression',
                expression: 'isIri(?a)',
            });
        });

        it('accumulates properties into a path', function() {
            const firstClass = this.ontology.first();
            const secondClass = this.ontology.at(1);
            const p1 = serializeIri(firstClass.id, ns);
            const p2 = serializeIri(secondClass.id, ns);
            const entry = new Model({
                chain: new Collection([{
                    range: new Graph([{ '@id': rdfs.range }]),
                    traversal: true,
                    selection: firstClass,
                }, {
                    range: new Graph([{ '@id': rdfs.range }]),
                    traversal: true,
                    selection: secondClass,
                }, {
                    scheme: 'filter',
                    filter: new Model({ function: 'isIri' }),
                    range: new Graph([{ '@id': rdfs.range }]),
                }]),
            });
            const v = predictVariables(1);
            expect(serializeChain(entry, '?a', ns)).toEqual({
                tag: 'pattern',
                pattern: `?a ${p1} / ${p2} ${v[0]}.\nFILTER isIri(${v[0]})\n`,
            });
        });

        it('handles negation at the start', function() {
            const firstClass = this.ontology.first();
            const secondClass = this.ontology.at(1);
            const p1 = serializeIri(firstClass.id, ns);
            const p2 = serializeIri(secondClass.id, ns);
            const entry = new Model({
                chain: new Collection([{
                    scheme: 'logic',
                    action: 'not',
                }, {
                    range: new Graph([{ '@id': rdfs.range }]),
                    traversal: true,
                    selection: firstClass,
                }, {
                    range: new Graph([{ '@id': rdfs.range }]),
                    traversal: true,
                    selection: secondClass,
                }, {
                    scheme: 'filter',
                    filter: new Model({ function: 'isIri' }),
                    range: new Graph([{ '@id': rdfs.range }]),
                }]),
            });
            const v = predictVariables(1);
            expect(serializeChain(entry, '?a', ns)).toEqual({
                tag: 'expression',
                expression: (
                    'NOT EXISTS {\n' +
                    `?a ${p1} / ${p2} ${v[0]}.\n` +
                    `FILTER isIri(${v[0]})\n}`
                ),
            });
        });

        it('handles negation in the middle', function() {
            const firstClass = this.ontology.first();
            const secondClass = this.ontology.at(1);
            const p1 = serializeIri(firstClass.id, ns);
            const p2 = serializeIri(secondClass.id, ns);
            const entry = new Model({
                chain: new Collection([{
                    range: new Graph([{ '@id': rdfs.range }]),
                    traversal: true,
                    selection: firstClass,
                }, {
                    scheme: 'logic',
                    action: 'not',
                }, {
                    range: new Graph([{ '@id': rdfs.range }]),
                    traversal: true,
                    selection: secondClass,
                }, {
                    scheme: 'filter',
                    filter: new Model({ function: 'isIri' }),
                    range: new Graph([{ '@id': rdfs.range }]),
                }]),
            });
            const v = predictVariables(2);
            expect(serializeChain(entry, '?a', ns)).toEqual({
                tag: 'pattern',
                pattern: (
                    `?a ${p1} ${v[0]}.\n` +
                    'FILTER NOT EXISTS {\n' +
                    `${v[0]} ${p2} ${v[1]}.\n` +
                    `FILTER isIri(${v[1]})\n}\n`
                ),
            });
        });

        it('handles negation at the end', function() {
            const firstClass = this.ontology.first();
            const secondClass = this.ontology.at(1);
            const p1 = serializeIri(firstClass.id, ns);
            const p2 = serializeIri(secondClass.id, ns);
            const entry = new Model({
                chain: new Collection([{
                    range: new Graph([{ '@id': rdfs.range }]),
                    traversal: true,
                    selection: firstClass,
                }, {
                    range: new Graph([{ '@id': rdfs.range }]),
                    traversal: true,
                    selection: secondClass,
                }, {
                    scheme: 'logic',
                    action: 'not',
                }, {
                    scheme: 'filter',
                    filter: new Model({ function: 'isIri' }),
                    range: new Graph([{ '@id': rdfs.range }]),
                }]),
            });
            const v = predictVariables(1);
            expect(serializeChain(entry, '?a', ns)).toEqual({
                tag: 'pattern',
                pattern: (
                    `?a ${p1} / ${p2} ${v[0]}.\n` +
                    `FILTER !(isIri(${v[0]}))\n`
                ),
            });
        });

        it('recurses over and/or', function() {
            const firstClass = this.ontology.first();
            const secondClass = this.ontology.at(1);
            const p1 = serializeIri(firstClass.id, ns);
            const p2 = serializeIri(secondClass.id, ns);
            const entry = new Model({
                chain: new Collection([{
                    range: new Graph([{ '@id': rdfs.range }]),
                    traversal: true,
                    selection: firstClass,
                }, {
                    scheme: 'logic',
                    action: 'and',
                    branches: new Collection([{
                        chain: new Collection([{
                            range: new Graph([{ '@id': rdfs.range }]),
                            traversal: true,
                            selection: secondClass,
                        }, {
                            scheme: 'filter',
                            filter: new Model({ function: 'isIri' }),
                            range: new Graph([{ '@id': rdfs.range }]),
                        }]),
                    }, {
                        chain: new Collection([{
                            scheme: 'filter',
                            filter: new Model({ operator: '=' }),
                            range: new Graph([{ '@id': rdfs.range }]),
                            value: owl.inverseOf,
                        }]),
                    }]),
                }]),
            });
            const v = predictVariables(2);
            expect(serializeChain(entry, '?a', ns)).toEqual({
                tag: 'pattern',
                pattern: (
                    `?a ${p1} ${v[0]}.\n` +
                    `${v[0]} ${p2} ${v[1]}.\n` +
                    `FILTER isIri(${v[1]})\n` +
                    `FILTER (${v[0]} = ${serializeIri(owl.inverseOf, ns)})\n`
                ),
            });
        });

        it('injects type assertions where possible and necessary', function() {
            const firstClass = this.ontology.first();
            const secondClass = this.ontology.at(1);
            const p1 = serializeIri(firstClass.id, ns);
            const p2 = serializeIri(secondClass.id, ns);
            const entry = new Model({
                chain: new Collection([{
                    range: new Graph([{ '@id': rdfs.range }]),
                    assertion: true,
                    selection: firstClass,
                }, {
                    scheme: 'logic',
                    action: 'and',
                    branches: new Collection([{
                        chain: new Collection([{
                            range: new Graph([{ '@id': rdfs.range }]),
                            assertion: true,
                            selection: secondClass,
                        }, {
                            scheme: 'filter',
                            filter: new Model({ function: 'isIri' }),
                            range: new Graph([{ '@id': rdfs.range }]),
                        }]),
                    }, {
                        chain: new Collection([{
                            scheme: 'filter',
                            filter: new Model({ operator: '=' }),
                            range: new Graph([{ '@id': rdfs.range }]),
                            value: owl.inverseOf,
                        }]),
                    }]),
                }]),
            });
            const v = predictVariables(2);
            expect(serializeChain(entry, '?a', ns)).toEqual({
                tag: 'pattern',
                pattern: (
                    `?a a ${p2}.\n` +
                    `FILTER isIri(?a)\n` +
                    `FILTER (?a = ${serializeIri(owl.inverseOf, ns)})\n`
                ),
            });
        });
    });

    describe('modelToQuery', function() {
        const ns = {
            r: rdfs(),
            o: owl(),
            rit: readit(),
        };

        it('applies serializeChain and wraps a CONSTRUCT query', function() {
            const entry = new Model({
                chain: new Collection([{
                    scheme: 'filter',
                    filter: new Model({ function: 'isIri' }),
                    range: new Graph([{ '@id': rdfs.range }]),
                }]),
            });
            expect(modelToQuery(entry, ns)).toBe(
                `PREFIX r: <${(rdfs())}>\n` +
                `PREFIX o: <${(owl())}>\n` +
                `PREFIX rit: <${readit()}>\n` +
                '\n' +
                'CONSTRUCT {\n' +
                '    ?item ?p ?o\n' +
                `} FROM <${item()}> WHERE {\n` +
                '    ?item ?p ?o.\n' +
                '    FILTER isIri(?item)\n' +
                '}\n'
            );
        });

        it('adjoins a top-level pattern directly', function() {
            const firstClass = this.ontology.first();
            const p1 = serializeIri(firstClass.id, ns);
            const entry = new Model({
                chain: new Collection([{
                    range: new Graph([{ '@id': rdfs.range }]),
                    traversal: true,
                    selection: firstClass,
                }, {
                    scheme: 'filter',
                    filter: new Model({ function: 'isIri' }),
                    range: new Graph([{ '@id': rdfs.range }]),
                }]),
            });
            const v = predictVariables(1);
            expect(modelToQuery(entry, ns)).toBe(
                `PREFIX r: <${(rdfs())}>\n` +
                `PREFIX o: <${(owl())}>\n` +
                `PREFIX rit: <${readit()}>\n` +
                '\n' +
                'CONSTRUCT {\n' +
                '    ?item ?p ?o\n' +
                `} FROM <${item()}> WHERE {\n` +
                '    ?item ?p ?o.\n' +
                `    ?item ${p1} ${v[0]}.\n` +
                `FILTER isIri(${v[0]})\n\n` +
                '}\n'
            );
        });
    });
});
