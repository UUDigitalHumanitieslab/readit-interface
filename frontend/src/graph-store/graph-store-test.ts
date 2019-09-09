import 'jasmine-ajax';
import GraphStore from './graph-store';

describe('GraphStore', function () {
    let gs: GraphStore;

    beforeEach(function () {
        gs = new GraphStore();
    });

    it('collects default graphs', async function() {
        await gs.collectDefaults();
        expect(gs.store.length).toBeGreaterThan(0);
        expect(gs.store.length).toEqual(1717);
    });
});
