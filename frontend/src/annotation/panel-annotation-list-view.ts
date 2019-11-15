import { ViewOptions as BaseOpt } from 'backbone';
import { extend, sortBy } from 'lodash';
import { each } from 'async';
import View from '../core/view';

import { oa } from '../jsonld/ns';
import Node from '../jsonld/node';
import Graph from '../jsonld/graph';

import { isType, getScrollTop } from '../utilities/utilities';

import annotationsTemplate from './panel-annotation-list-template';
import ItemSummaryBlockView from '../utilities/item-summary-block/item-summary-block-view';
import { getSource } from '../utilities/annotation/annotation-utilities';

export interface ViewOptions extends BaseOpt<Node> {
    ontology: Graph;
    collection: Graph;
}

export default class AnnotationListView extends View<Node> {
    collection: Graph;
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

        this.listenTo(this.collection, 'change', this.render);

        let initialSource;

        this.collection.each(node => {
            if (isType(node, oa.Annotation)) {
                let source = getSource(node);
                if (!initialSource) initialSource = source;
                if (source === initialSource) this.initSummaryBlock(node);
            }
        });

        let self = this;
        each(this.summaryBlocks, (sb, callback) => sb.ensurePositionDetails(callback), function (err) {
            self.summaryBlocks = self.sortSummaryBlocks();
            self.render();
        });

        this.listenTo(this.collection, 'add', this.add);
        return this;
    }

    initSummaryBlock(node: Node): this {
        if (isType(node, oa.Annotation)) {
            let view = new ItemSummaryBlockView({
                model: node,
                ontology: this.ontology
            });
            view.on('click', this.onSummaryBlockClicked, this);
            view.on('hover', this.onSummaryBlockedHover, this);
            this.summaryBlocks.push(view);
        }
        return this;
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

    add(annotation: Node): this {
        this.initSummaryBlock(annotation);
        this.summaryBlocks = this.sortSummaryBlocks();
        return this.render();
    }

    sortSummaryBlocks(): ItemSummaryBlockView[] {
        return sortBy(this.summaryBlocks, ['positionDetails.startNodeIndex', 'positionDetails.startCharacterIndex']);
    }

    scrollTo(annotation: Node): this {
        if (!annotation) return this;
        let scrollToBlock = this.getSummaryBlock(annotation);

        if (scrollToBlock) {
            let scrollableEl = this.$('.panel-content');
            let scrollTop = getScrollTop(scrollableEl, scrollToBlock.getTop(), scrollToBlock.getHeight());
            this.selectAnno(annotation);
            scrollableEl.animate({ scrollTop: scrollTop }, 800);
        }
        return this;
    }

    getSummaryBlock(annotation: Node): ItemSummaryBlockView {
        return this.summaryBlocks.find(sb => sb.model === annotation);
    }

    selectAnno(annotation: Node): this {
        this.getSummaryBlock(annotation).select();
        return this;
    }

    unSelectAnno(annotation: Node): this {
        this.getSummaryBlock(annotation).unSelect();
        return this;
    }

    onEditClicked(): this {
        this.trigger('annotation-listview:edit', this, this.collection);
        return this;
    }

    onSummaryBlockedHover(annotation: Node): this {
        this.trigger('hover', annotation);
        return this;
    }

    onSummaryBlockClicked(summaryBlock: ItemSummaryBlockView, annotation: Node): this {
        this.trigger('annotation-listview:blockClicked', this, annotation);
        return this;
    }
}
extend(AnnotationListView.prototype, {
    tagName: 'div',
    className: 'annotation-list-panel explorer-panel',
    template: annotationsTemplate,
    events: {
        'click .btn-edit': 'onEditClicked',
    }
});
