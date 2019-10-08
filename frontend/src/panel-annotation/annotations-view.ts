import { ViewOptions as BaseOpt } from 'backbone';
import { extend, sortBy } from 'lodash';
import View from '../core/view';

import { oa } from './../jsonld/ns';
import Node from '../jsonld/node';
import Graph from './../jsonld/graph';

import { isType, getScrollTop } from './../utilities/utilities';

import annotationsTemplate from './annotations-template';
import ItemSummaryBlockView from '../utilities/item-summary-block/item-summary-block-view';
import { getSource } from '../utilities/annotation-utilities';

export interface ViewOptions extends BaseOpt<Node> {
    ontology: Graph;
    collection: Graph;
}

export default class AnnotationsView extends View<Node> {
    ontology: Graph;
    summaryBlocks: ItemSummaryBlockView[];

    /**
     * Keep track of the currently highlighted summary block
     */
    currentlyHighlighted: ItemSummaryBlockView;

    constructor(options: ViewOptions) {
        super(options);
    }

    initialize(options): this {
        if (!options.ontology) throw new TypeError('ontology cannot be null or undefined');
        this.ontology = options.ontology;
        this.summaryBlocks = [];

        let initialSource;

        this.collection.each(node => {
            if (isType(node, oa.Annotation)) {
                let source = getSource(node);
                if (!initialSource) initialSource = source;
                if (source === initialSource) {
                    this.initSummaryBlock(node);
                }
            }
        });

        this.summaryBlocks = sortBy(this.summaryBlocks, ['positionDetails.startNodeIndex', 'positionDetails.startCharacterIndex']);

        return this;
    }

    initSummaryBlock(annotation: Node) {
        let view = new ItemSummaryBlockView({
            model: annotation,
            ontology: this.ontology
        });
        view.on('click', this.onSummaryBlockClicked, this);
        view.on('hover', this.onSummaryBlockedHovered, this);
        this.summaryBlocks.push(view);
    }

    render(): this {
        if (this.summaryBlocks) {
            this.summaryBlocks.forEach(sb => {
                sb.$el.detach();
            });
        }
        this.$el.html(this.template(this));
        let summaryList = this.$('.summary-list');

        this.summaryBlocks.forEach(sb => {
            sb.render().$el.appendTo(summaryList);
        });

        return this;
    }

    scrollTo(annotation: Node): this {
        if (!annotation) return this;
        let scrollToBlock = this.summaryBlocks.find(sb => sb.model === annotation);

        if (scrollToBlock) {
            let scrollableEl = this.$('.summary-list');
            let scrollTop = getScrollTop(scrollableEl, scrollToBlock.getTop(), scrollToBlock.getHeight());
            scrollableEl.animate({ scrollTop: scrollTop }, 800);
        }
        return this;
    }

    onEditClicked(): this {
        this.trigger('edit', this.collection);
        return this;
    }

    onSummaryBlockedHovered(annotation: Node): this {
        this.trigger('hover', annotation);
        return this;
    }

    onSummaryBlockClicked(summaryBlock: ItemSummaryBlockView, annotation: Node): this {
        this.currentlyHighlighted && this.currentlyHighlighted.toggleHighlight();
        summaryBlock.toggleHighlight();
        this.currentlyHighlighted = summaryBlock;
        this.trigger('click', annotation);
        return this;
    }
}
extend(AnnotationsView.prototype, {
    tagName: 'div',
    className: 'annotations-panel explorer-panel',
    template: annotationsTemplate,
    events: {
        'click .btn-edit': 'onEditClicked',
    }
});
