import 'jasmine-ajax';

import syncLD, { getLinkHeader, emitContext } from './sync';
import expandedData from './../mock-data/mock-expanded';
import compactData from './../mock-data/mock-compact';
import context from '../mock-data/mock-context';
import Graph from './graph';
import Node from './node';

describe('the jsonld/sync module', function() {
    beforeEach(function() {
        jasmine.Ajax.install();
    });

    afterEach(function() {
        jasmine.Ajax.uninstall();
    });

    describe('syncLD', function() {
        // Please merge this with whatever you want to keep from
        // your original "sync" suite.

        it('compacts the request data if a context is set', async function() {
            // Use 'create' or 'update' as the method.
            // The 'read' method doesn't send any data by default.
        });

        it('sends the request through Backbone.sync', async function() {
        });

        it('forwards the options to Backbone.sync', async function() {
        });

        it('omits success and error handlers when forwarding', async function() {
        });

        it('expands and flattens the response data', async function() {
        });

        it('uses context from the link header if present', async function() {
            // Use application/json instead of application/ld+json for this one.
            // See https://www.w3.org/TR/json-ld/#interpreting-json-as-json-ld
            // on how to format the link header.

            // The link in the header will be requested, so you'll have to
            // respond with a {"@context": aContext} through jasmine.Ajax. The
            // context-type of the latter response has to be
            // application/ld+json again.
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

    describe('getLinkHeader', function() {
        // See https://www.w3.org/TR/json-ld/#interpreting-json-as-json-ld
        // on how to format the link header.
        // Use application/json for all specs except for the second.

        it('returns the context if the link header refers to one context', function() {
        });

        it('returns undefined if the content-type is application/ld+json', function() {
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

    describe('emitContext', function() {
        it('triggers sync:context on the model regardless of the arguments', function() {
        });

        it('emits the inline context if no header is present', function() {
        });

        it('emits the header context if no inline is present', function() {
            // The header argument must be a {target: 'url'}.
        });

        it('emits [header, inline] if both are present', function() {
            // The header argument must be a {target: 'url'}.
        });

        it('emits undefined if neither is present', function() {
        });
    });
});

describe("sync", async function () {
    let request, expandedGraph;
    let success, error;

    beforeEach(function () {
        jasmine.Ajax.install();
        success = jasmine.createSpy('success');
        error = jasmine.createSpy('error');

        expandedGraph = new Graph(expandedData);
        expandedGraph.setContext(context);
    });


    afterEach(async function () {
        jasmine.Ajax.uninstall();
    });

    it("does something", async function () {
        let result = syncLD('POST', expandedGraph, { success, error, url: 'https://bogus.blah.foo', });

        // wachten
        await sleep(10);

        request = jasmine.Ajax.requests.mostRecent();

        console.log(request);


        let response = {
            "status": 200,
            "contentType": "application/ld+json",
            "responseText": JSON.stringify(compactData)
        }
        request.respondWith(response);

        // assert something about request

        await sleep(10);

        expect(success).toHaveBeenCalled();

        // response
        let actual = await result;
        console.log(actual);
    });



    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
})
