import { startStore, endStore } from '../test-util';
import Node from '../common-rdf/node';
import { item, vocab, oa } from '../common-rdf/ns';
import mockItems from '../mock-data/mock-items';
import Graph from '../common-rdf/graph';

xdescribe('annotation-utilities', function () {
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
});
