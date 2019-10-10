import 'jasmine-ajax';
// Request stubs have an undocumented .andCallFunction method:
// https://github.com/jasmine/jasmine-ajax/pull/152
// It appears, however, that the signature changed since the above
// pull request. The passed function does not receive the stub
// instance as an argument; the only argument is the
// FakeXmlHttpRequest.
// https://github.com/jasmine/jasmine-ajax/blob/efc1961b131aec836a9bcf14285f8c4f9f2eefb3/src/requestStub.js#L51

import rdfParser from 'rdf-parse';
import * as $ from 'jquery';

import * as csrf from '../core/csrf';
import syncLD, { transform, combineContext, getLinkHeader } from './sync';
import expandedData from './../mock-data/mock-expanded';
import compactData from './../mock-data/mock-compact';
import context from '../mock-data/mock-context';
import Graph from './graph';
import Node from './node';

describe('the jsonld/sync module', function() {
    let request, expandedGraph;
    let success, error;

    beforeEach(function () {
        jasmine.Ajax.install();
        expandedGraph = new Graph(null, {context});
        success = jasmine.createSpy('success');
        error = jasmine.createSpy('error');
    });

    afterEach(function() {
        jasmine.Ajax.uninstall();
    });

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    describe('syncLD', function() {

        it('compacts the request data if a context is set', function(done) {
            // The 'read' method doesn't send any data by default.

            expandedGraph.set(expandedData);
            jasmine.Ajax.stubRequest('/api/test').andCallFunction(xhr => {
                expect(xhr.data()).toEqual(compactData);
                done();
            });
            syncLD('create', expandedGraph, {url: '/api/test'});
        });

        it('accepts many common RDF encodings', function(done) {
            jasmine.Ajax.stubRequest('/api/test').andCallFunction(xhr => {
                const acceptHeader = xhr.requestHeaders.Accept;
                [
                    'application/trig; q=1',
                    'application/ld+json; q=0.9',
                    'text/turtle; q=0.8',
                    'application/rdf+xml; q=0.75',
                    'text/html; q=0.7',
                    'application/xhtml+xml; q=0.62',
                    'application/n-quads; q=0.6',
                    'application/xml; q=0.5',
                    'text/xml; q=0.5',
                    'image/svg+xml; q=0.5',
                    'application/json; q=0.45',
                    'application/n-triples; q=0.3',
                    'text/n3; q=0.1',
                ].forEach(contentType =>
                    expect(acceptHeader).toContain(contentType)
                );
                done();
            });
            syncLD('read', expandedGraph, {url: '/api/test'});
        });

        it('sends the request through syncWithCSRF', function(done) {
            spyOn(csrf, 'syncWithCSRF').and.callThrough();
            jasmine.Ajax.stubRequest('/api/test').andCallFunction(xhr => {
                expect(csrf.syncWithCSRF).toHaveBeenCalled();
                done();
            });
            syncLD('create', expandedGraph, {url: '/api/test'});
        });

        it('forwards the options to csrf.syncWithCSRF', function(done) {
            spyOn(csrf, 'syncWithCSRF').and.callFake((method, model, options) => {
                expect(options).toEqual(jasmine.objectContaining({
                    url: '/api/test',
                    arbitraryOption: 'bananas',
                }));
                done();
            });
            syncLD('create', expandedGraph, {
                url: '/api/test',
                arbitraryOption: 'bananas',
            });
        });

        it('omits success and error handlers when forwarding', function(done) {
            spyOn(csrf, 'syncWithCSRF').and.callFake((method, model, options) => {
                expect(options.success).not.toBeDefined();
                expect(options.error).not.toBeDefined();
                done();
            });
            syncLD('create', expandedGraph, {
                url: '/api/test',
                success: () => 'Yay!',
                error: () => 'Aww.',
            });
        });

        it('expands and flattens the response data', async function() {
            jasmine.Ajax.stubRequest('/api/test').andReturn({
                status: 200,
                contentType: 'application/ld+json',
                responseText: `{
                    "@context": {
                        "ex": "http://example.org#"
                    },
                    "@id": "ex:test",
                    "@type": "ex:someType",
                    "ex:someProp": {
                        "@id": "ex:test2",
                        "ex:someOtherProp": "text"
                    }
                }`,
            });
            // The fetch method calls the sync method internally.
            let response = await expandedGraph.fetch({url: '/api/test'});
            expect(response).toEqual([{
                '@id': 'http://example.org#test',
                '@type': ['http://example.org#someType'],
                'http://example.org#someProp': [{
                    '@id': 'http://example.org#test2',
                }],
            }, {
                '@id': 'http://example.org#test2',
                'http://example.org#someOtherProp': [{'@value': 'text'}],
            }]);
            expect(expandedGraph.toJSON()).toEqual(response);
        });

        it('emits the server-dictated context', async function() {
            // Listen for sync:context on the model.
        });

        it('calls the success handler with the flattened response and the jqXHR', async function() {
            // Note: first and third argument, respectively.
        });

        it('resolves with the flattened response', async function() {
        });

        it('calls the error handler with the jqXHR and an error object', async function() {
            // Note: first and third argument, respectively.
        });

        it('rejects with whatever exception was thrown', async function() {
        });
    });

    describe('transform', function() {
        // transform takes a single jqXHR parameter.
        // In each of the following tests, stub the request and make
        // sure to set the appropriate contentType in the response.

        it('strips parameters from the response type', async function() {
            const testUrl = 'http://test.com';
            jasmine.Ajax.stubRequest(testUrl).andReturn({
                status: 200,
                contentType: 'application/ld+json; charset=UTF-8',
                responseText: '{}',
            });
            const xhr = $.get(testUrl);
            await xhr;
            spyOn(rdfParser, 'parse').and.callThrough();
            await transform(xhr);
            expect(rdfParser.parse).toHaveBeenCalledWith(
                jasmine.anything(),
                jasmine.objectContaining({contentType: 'application/ld+json'}),
            );
        });

        it('can turn compact JSON-LD into flat JSON-LD', function() {
        });

        it('uses context from the link header if applicable', async function() {
            // Use application/json instead of application/ld+json for this one.
            // See https://www.w3.org/TR/json-ld/#interpreting-json-as-json-ld
            // on how to format the link header.

            // The link in the header will be requested, so you'll have to
            // respond with a {"@context": aContext} through jasmine.Ajax. The
            // context-type of the latter response has to be
            // application/ld+json again.
        });

        it('can turn RDF/XML into flat JSON-LD', function() {
        });

        it('can turn turtle into flat JSON-LD', function() {
        });
    });

    describe('combineContext', function() {
        // combineContext takes a single jqXHR parameter.
        // Use application/json for all specs.

        it('returns JSON-LD as a string and a parsed context', function() {
        });

        it('includes the link header in the string if applicable', function() {
        });

        it('includes the link header in the returned context', function() {
        });
    });

    describe('getLinkHeader', function() {
        // See https://www.w3.org/TR/json-ld/#interpreting-json-as-json-ld
        // on how to format the link header.
        // Use application/json for all specs.

        it('returns the context if the link header refers to one context', function() {
            // Content-Type: application/json
            // Link: <http://json-ld.org/contexts/person.jsonld>; rel="http://www.w3.org/ns/json-ld#context"; type="application/ld+json"

            // {
            // "name": "Markus Lanthaler",
            // "homepage": "http://www.markus-lanthaler.com/",
            // "image": "http://twitter.com/account/profile_image/markuslanthaler"
            // }

        });

        it('returns undefined if no link header is present', function() {
        });

        it('returns undefined if the link header contains no context', function() {
            // Use a "rel" other than http://www.w3.org/ns/json-ld#context.
        });

        it('throws a JsonLdError otherwise', function() {
            // Pass multiple context links in the header.
        });
    });
});
