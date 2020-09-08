import { extend } from 'lodash';

import { CollectionView } from '../core/view';
import Model from '../core/model';

import SnippetView from '../utilities/snippet-view/snippet-view';
import sourceSnippetsTemplate from './source-snippets-template';

export default class SourceSnippetsView extends CollectionView<Model, SnippetView> {
    initialize() {
        this.initItems().render().initCollectionEvents();
    }
    
    renderContainer(): this {
        this.$el.html(this.template(this));
        return this;
    }
    
    makeItem(model: Model): SnippetView {
        const snippet = model.attributes['snippet'];
        const snippetView = new SnippetView({snippet: snippet});
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
