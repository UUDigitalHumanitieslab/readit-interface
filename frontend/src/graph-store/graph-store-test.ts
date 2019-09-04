import { oa, dcterms } from './../jsonld/ns';
import GraphStore from './graph-store';
import mockSchema from './mock-schema';

describe('GraphStore', function () {
    let gs;

    beforeEach(function () {
        gs = new GraphStore();
        gs.store = mockSchema;
    });


    it('extracts url from a node\'s @id', function () {
        // oa has the # before the item name
        let actual = gs.getUrl(oa.Annotation);
        expect(actual).toEqual('http://www.w3.org/ns/oa.jsonld');

        // dcterms has no #
        actual = gs.getUrl(dcterms.creator);
        expect(actual).toEqual('http://purl.org/dc/terms.jsonld')
    });
});
