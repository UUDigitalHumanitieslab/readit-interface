import { constant } from 'lodash';

import mockSources from '../mock-data/mock-sources';
import { fakeHierarchy } from './filter-view-test';

import Collection from '../core/collection';
import Subject from '../common-rdf/subject';
import Graph from '../common-rdf/graph';
import FlatItem from '../common-adapters/flat-item-model';
import FlatCollection from '../common-adapters/flat-annotation-collection';
import explorerChannel from '../explorer/explorer-radio';

import AnnoListPanel from './annotation-list-panel';

describe('AnnotationListPanel', function() {
    beforeEach(function() {
        this.items = new Graph();
        this.flat = new FlatCollection(this.items);
        const node = new Subject(mockSources);
        this.model = new FlatItem(node);
        explorerChannel.reply('filter-hierarchy', constant(fakeHierarchy));
        explorerChannel.reply('filter-settings', () => ({
            hidden: new Collection(),
            collapsed: new Collection(),
        }));
    });

    afterEach(function() {
        explorerChannel.stopReplying();
    });

    it('can be constructed in isolation', function() {
        const view = new AnnoListPanel({ collection: this.flat, model: this.model });
        expect(view.$el.html()).toBeTruthy();
        view.remove();
    });
});
