import Multibranch from './multibranch-view';

describe('semantic search MultibranchView', function() {
    it('can be constructed in isolation', function() {
        const view = new Multibranch();
        expect(view.$el.children().length).toBe(1);
        view.remove();
    });
});
