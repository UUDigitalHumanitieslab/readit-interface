import { extend } from 'lodash';
import { ViewOptions as BaseOpt } from 'backbone';

import { CollectionView } from '../core/view';
import Graph from '../jsonld/graph';
import Node from '../jsonld/node';

import SnippetView from '../utilities/snippet-view/snippet-view';
import sourceSnippetsTemplate from './source-snippets-template';

export interface ViewOptions extends BaseOpt<Node> {
    collection: Graph;
}

export default class SourceSnippetsView extends CollectionView<Node, SnippetView> {
    initialize() {
        this.initItems().render().initCollectionEvents();
    }
    
    renderContainer(): this {
        this.$el.html(this.template(this));
        return this;
    }
    
    makeItem(model: Node): SnippetView {
        const snippetView = new SnippetView({selector: model});
        return snippetView;
    }
}
extend(SourceSnippetsView.prototype, {
    className: 'source-snippets',
    template: sourceSnippetsTemplate,
    container: '.snippet-container',
    events: {
        reset: 'close',
        submit: 'submit',
        'click .add': 'addExternalResource'
    },
});
