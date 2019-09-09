import 'jasmine-ajax';
import { schema, oa, dcterms, rdfs } from './../jsonld/ns';
import GraphStore from './graph-store';
import mockSchema from './mock-schema';
import mockOa from './mock-oa';
// import mockBroken from './mock-schema-broken-json';
import mockDcHtml from './mock-dublin-core-html';
import Node from '../jsonld/node';

describe('GraphStore', function () {
    let gs: GraphStore;
    const schemaUrl = 'http://schema.org.jsonld';
    const oaUrl = 'http://www.w3.org/ns/oa.jsonld';


    beforeEach(function () {
        jasmine.Ajax.install();
        gs = new GraphStore();

        initStubRequest(schemaUrl, mockSchema);
        initStubRequest(oaUrl, mockOa);
    });

    afterEach(function() {
        jasmine.Ajax.uninstall();
    });

    function initStubRequest(url, responseText) {
        jasmine.Ajax.stubRequest(url).andReturn({
            status: 200,
            responseText: JSON.stringify(responseText),
        });
    }

    it('adds Graphs to the store, but no duplicates', async function () {
        console.log(gs.store);

        // await gs.get(schema.CreativeWork);
        // expect(gs.store.length).toEqual(1646);
        // await gs.get(schema.CreativeWork);
        // expect(gs.store.length).toEqual(1646);
        // await gs.get(oa.Annotation);
        // expect(gs.store.length).toEqual(1717);
    });

    it('extracts a base url from a node\'s @id', function () {
        // oa has the # before the item name
        let actual = gs.getUrl(oa.Annotation);
        expect(actual).toEqual('http://www.w3.org/ns/oa');

        // dcterms has no #
        actual = gs.getUrl(dcterms.creator);
        expect(actual).toEqual('http://purl.org/dc/terms')
    });

    it('handles response data that is HTML', async function () {
        const dcHtml = 'http://www.purl.org/dc/html#broken';
        initStubRequest(dcHtml, mockDcHtml);
        let node = await gs.get(dcHtml);
        expect(node).not.toBeUndefined();
        expect(node.get('@id')).toEqual(dcHtml);
    });

    it('returns a node from the store', function () {
        expect(gs.get(oa.Annotation)).not.toBeUndefined('oa');
        expect(gs.get(schema.CreativeWork)).not.toBeUndefined('schema');
    });

    // it('collects default graphs', function() {
    //     gs.collectDefaultGraphs();
    //     expect(gs.store.length).toBeGreaterThan(0);
    // });
});
