import { startStore, endStore } from '../../test-util';
import Node from '../../jsonld/node';
import { item, vocab, oa } from '../../jsonld/ns';
import mockItems from '../../mock-data/mock-items';
import { getEndSelector, getSelector } from './annotation-utilities';
import Graph from '../../jsonld/graph';

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
            let endSelector = getSelector(getAnno1instance(), oa.TextQuoteSelector);
            expect(endSelector).toBeTruthy();
            expect(endSelector.get('@id')).toEqual(item('700'));
        });

        it('correctly retrieves TextPositionSelectors from oa:Annotations', function()  {
            let endSelector = getSelector(getAnno1instance(), oa.TextPositionSelector);
            expect(endSelector).toBeTruthy();
            expect(endSelector.get('@id')).toEqual(item('400'));
        });
    });
});
