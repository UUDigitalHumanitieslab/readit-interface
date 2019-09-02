import Node from './../jsonld/node';
import { item } from './../jsonld/ns';
import mockItems from './../mock-data/mock-items';
import { validateCompleteness, getEndSelector } from './annotation-utilities';
import Graph from '../jsonld/graph';

describe('annotation-utilities', function () {
    const anno1InstanceId = item('100');
    let items = new Graph(mockItems);

    function getAnno1instance(): Node {
        return items.get(anno1InstanceId);
    }

    describe('validateCompleteness', function () {
        it('identifies complete annotations', function()  {
            expect(validateCompleteness(getAnno1instance())).toEqual(undefined);
        });

        it('throws TypeError if parts are missing', function()  {
            let anno = getAnno1instance();
            items.remove(getEndSelector(anno));
            expect(function() { validateCompleteness(anno) }).toThrowError(TypeError);
        });
    });
});
