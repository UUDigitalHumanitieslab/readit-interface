import { startStore, endStore } from '../../test-util';
import Node from '../../core/node';
import { item, vocab, oa } from '../../core/ns';
import mockItems from '../../mock-data/mock-items';
import { getSelector } from './annotation-utilities';
import Graph from '../../core/graph';

describe('annotation-utilities', function () {
    const anno1InstanceId = item('100');
    let items: Graph;

    function getAnno1instance(): Node {
        return items.get(anno1InstanceId);
    }

    beforeEach(startStore);
    afterEach(endStore);

    beforeEach(function() {
        items = new Graph(mockItems);
    });

    describe('getSelector', function () {
        it('correctly retrieves TextQuoteSelectors from oa:Annotations', function()  {
            let selector = getSelector(getAnno1instance(), oa.TextQuoteSelector);
            expect(selector).toBeTruthy();
            expect(selector.get('@id')).toEqual(item('700'));
        });

        it('correctly retrieves TextPositionSelectors from oa:Annotations', function()  {
            let selector = getSelector(getAnno1instance(), oa.TextPositionSelector);
            expect(selector).toBeTruthy();
            expect(selector.get('@id')).toEqual(item('400'));
        });
    });
});
