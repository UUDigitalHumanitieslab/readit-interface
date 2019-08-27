import { defaults } from 'lodash';

import { webAnnoExerpt, composedContext } from '../mock-data/mock-context';
import {
    JsonObject,
    JsonLdContext,
    ResolvedContext,
    JsonLdObject,
    FlatLdObject,
} from './json';

const exampleJson = {
    a: 'x',
    b: 10,
    c: {
        d: 'y',
        e: 11,
        f: {},
        g: [],
        h: true,
        i: false,
        j: null,
    },
    k: ['z', 12, {}, [], true, false, null],
    l: true,
    m: false,
    n: null,
};

describe('JSON typings', function() {
    describe('JsonObject', function() {
        it('fully implements the JSON standard', function() {
            const test: JsonObject = exampleJson;
            expect(test).toBeDefined();
        });

        it('disallows functions', function() {
            /**/  // remove second slash to break compilation
            pending('Edit this test to check that compilation fails.');
            /*/
            const test: JsonObject = {
                a: function(x, y) { return x + y; },
            };
            expect(test).not.toBeDefined();
            // */
        });

        it('disallows special objects', function() {
            /**/  // remove second slash to break compilation
            pending('Edit this test to check that compilation fails.');
            /*/
            const test: JsonObject = {
                a: new Date(),
            };
            expect(test).not.toBeDefined();
            // */
        });
    });

    describe('JsonLdContext', function() {
        it('typechecks with realistic contexts', function() {
            const test: JsonLdContext = composedContext;
            expect(test).toBeDefined();
        });
    });

    describe('ResolvedContext', function() {
        it('does not allow external context IRIs', function() {
            /**/  // remove second slash to break compilation
            pending('Edit this test to check that compilation fails.');
            /*/
            const test: ResolvedContext = composedContext;
            expect(test).not.toBeDefined();
            // */
        });

        it('still typechecks with realistic contexts otherwise', function() {
            const test: ResolvedContext = webAnnoExerpt;
            expect(test).toBeDefined();
        });
    });

    describe('JsonLdObject', function() {
        it('is a JsonObject with additional features', function() {
            const test: JsonLdObject = defaults({
                '@context': composedContext,
                '@id': 'banana',
            }, exampleJson);
            const context: JsonLdContext = test['@context'];
            const id: string = test['@id'];
            expect(test).toBeDefined();
        });
    });

    describe('FlatLdObject', function() {
        it('is very restrictive compared to JsonLdObject', function() {
            /**/  // remove second slash to break compilation
            pending('Edit this test to check that compilation fails.');
            /*/
            const test: FlatLdObject = defaults({
                '@context': composedContext,
                '@id': 'banana',
            }, exampleJson);
            expect(test).not.toBeDefined();
            // */
        });

        it('typechecks with elaborate cases', function() {
            const test: FlatLdObject = {
                '@id': 'http://example.org/1',
                '@type': ['http://example.org/2', 'http://example.org/3'],
                'http://example.org/4': [{
                    '@id': 'http://example.org/5',
                }, {
                    '@value': 'plaintext',
                }, {
                    '@value': 'platte text',
                    '@language': 'nl',
                }, {
                    '@value': '++++[>+++++[>+++++<-]<-]>>++++.+.',
                    '@type': 'http://www.muppetlabs.com/~breadbox/bf/',
                }, {
                    '@list': [{
                        '@value': 'more plaintext',
                    }, {
                        '@id': 'http://example.org/6',
                    }],
                }],
                'http://example.org/7': [{
                    '@value': 42,
                }, {
                    '@value': true,
                }, {
                    '@value': false,
                }, {
                    '@value': null,
                }],
            };
            expect(test).toBeDefined();
        });
    });
});
