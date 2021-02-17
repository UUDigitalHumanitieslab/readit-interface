import explorerChannel from './explorer-radio';
import { announceRoute } from './utilities';

describe('explorer utilities', function() {
    describe('announceRoute', function() {
        beforeEach(function() {
            this.spy = jasmine.createSpy('currentRouteSpy');
            this.mockPanel = {
                model: {
                    id: 'http://readit.example/item/20',
                },
            };
            explorerChannel.on('currentRoute', this.spy);
        });

        afterEach(function() {
            explorerChannel.off();
        });

        function expectRoute(handler, route) {
            handler.call(this.mockPanel);
            expect(this.spy).toHaveBeenCalledWith(route, this.mockPanel);
        }

        it('creates a function that triggers an event', function() {
            const handler = announceRoute('item', ['model', 'id']);
            expectRoute.call(this, handler, 'explore/item/20');
        });

        it('permits plain routes', function() {
            const handler = announceRoute('explore');
            expectRoute.call(this, handler, 'explore');
        });
    });
});
