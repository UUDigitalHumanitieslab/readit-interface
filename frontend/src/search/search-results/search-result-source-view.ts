import { ViewOptions as BaseOpt } from 'backbone';
import { extend } from 'lodash';
import View from '../../core/view';

import searchResultSourceTemplate from './search-result-source-template';

import { oa, schema } from './../../jsonld/ns';
import ldChannel from './../../jsonld/radio';
import Node from '../../jsonld/node';
import { isType } from '../../utilities/utilities';
import LabelView from '../../utilities/label-view';
import SnippetView from '../../utilities/snippet-view/snippet-view';

export interface ViewOptions extends BaseOpt<Node> {
    model: Node;
}

export default class SearchResultSourceView extends View<Node> {
    snippetView: SnippetView;
    labelView: LabelView;
    title: string;

    constructor(options: ViewOptions) {
        super(options);
    }

    initialize(options: ViewOptions): this {
        this.processModel(this.model);
        this.listenTo(this.model, 'change', this.processModel);
        return this;
    }

    processModel(annotation: Node): this {
        let targets = annotation.get(oa.hasTarget);
        targets.forEach(n  => {
            this.processTarget(n as Node);
            this.stopListening(n, 'change', this.processTarget);
            this.listenTo(n, 'change', this.processTarget);
        });

        return this;
    }

    processTarget(target: Node): this {
        if (isType(target, oa.SpecificResource)) {
            let source = target.get(oa.hasSource)[0] as Node;
            this.stopListening(source, 'change', this.processSource);
            this.listenTo(source, 'change', this.processSource);
            this.processSource(source);

            let selectors: Node[] = target.get(oa.hasSelector) as Node[];
            for (let selector of selectors) {
                this.processSelector(selector);
                this.stopListening(selector, 'change', this.processSelector);
                this.listenTo(selector, 'change', this.processSelector);
            }
        }

        return this;
    }

    processSource(source: Node): this {
        this.title = source.get(schema.name)[0] as string;
        let sourceOntologyInstance = ldChannel.request('obtain', source.get('@type')[0] as string);
        if (!this.labelView) {
            this.labelView = new LabelView({ model: sourceOntologyInstance });
            this.labelView.render();
        }
        return this;
    }

    processSelector(selector: Node): this {
        if (isType(selector, oa.TextQuoteSelector)) {
            this.processTextQuoteSelector(selector);
        }

        return this;
    }

    processTextQuoteSelector(selector: Node): this {
        if (this.snippetView) return;
        this.snippetView = new SnippetView({
            title: this.title,
            selector: selector
        });
        this.snippetView.render();
        return this;
    }

    render(): this {
        if (this.snippetView) this.snippetView.$el.detach();
        if (this.labelView) this.labelView.$el.detach();
        this.$el.html(this.template(this));

        if (this.snippetView) this.$('.snippet-container').append(this.snippetView.el);
        if (this.labelView) this.$('.label-container').append(this.labelView.el);
        return this;
    }
}
extend(SearchResultSourceView.prototype, {
    tagName: 'div',
    className: 'search-result-source',
    template: searchResultSourceTemplate,
    events: {
    }
});
