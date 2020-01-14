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

        it('correctly retrieves vocab(\'RangeSelector\')s from oa:Annotations', function()  {
            let endSelector = getSelector(getAnno1instance(), vocab('RangeSelector'));
            expect(endSelector).toBeTruthy();
            expect(endSelector.get('@id')).toEqual(item('400'));
        });
    });

    describe('getEndSelector', function () {
        it('correctly retrieves end selectors from oa:Annotations', function()  {
            let endSelector = getEndSelector(getAnno1instance());
            expect(endSelector).toBeTruthy();
            expect(endSelector.get('@id')).toEqual(item('501'));
        });

        it('correctly retrieves end selectors from vocab(\'RangeSelector\')s', function()  {
            let selector = getSelector(getAnno1instance(), vocab('RangeSelector'));
            let endSelector = getEndSelector(selector);
            expect(endSelector).toBeTruthy();
            expect(endSelector.get('@id')).toEqual(item('501'));
        });


    });
});
