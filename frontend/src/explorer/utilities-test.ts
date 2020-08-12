import explorerChannel from './radio';
import { announceRoute } from './utilities';

describe('explorer utilities', function() {
    describe('announceRoute', function() {
        it('creates a function that triggers an event', function() {
            const spy = jasmine.createSpy('currentRouteSpy');
            const mockPanel = {
                model: {
                    id: 'http://readit.example/item/20',
                },
            };
            const handler = announceRoute('item', ['model', 'id']);
            explorerChannel.on('currentRoute', spy);
            handler.call(mockPanel);
            expect(spy).toHaveBeenCalledWith('explore/item/20', mockPanel);
        });
    });
});
