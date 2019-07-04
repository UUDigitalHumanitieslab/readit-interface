require('jasmine-ajax')

import syncLD from './sync';
import expandedData from './../mock-data/mock-expanded';
import compactData from './../mock-data/mock-compact';
import { webAnnoExerpt, contextIRI } from '../mock-data/mock-context';
import Graph from './graph';
import Node from './node';

describe("sync", async function () {
    let request, expandedGraph;
    let success, error;

    beforeEach(function () {
        jasmine.Ajax.install();
        success = jasmine.createSpy('success');
        error = jasmine.createSpy('error');

        expandedGraph = new Graph(expandedData);

        // needed to evade error on graph.whenContext (i.e. this.meta is undefined)
        // Uncaught (in promise) TypeError: Cannot read property 'whenContext' of undefined
        // at Graph.get [as whenContext] (graph.ts:34)
        // at Object.<anonymous> (sync.ts:21)
        expandedGraph.meta = new Node(webAnnoExerpt);
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
