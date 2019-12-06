import { ViewOptions as BaseOpt } from 'backbone';
import { extend, sortedIndexBy } from 'lodash';
import View from '../core/view';

import { oa } from '../jsonld/ns';
import Node from '../jsonld/node';
import Graph from '../jsonld/graph';

import { isType, getScrollTop } from '../utilities/utilities';

import annotationsTemplate from './panel-annotation-list-template';
import ItemSummaryBlockView from '../utilities/item-summary-block/item-summary-block-view';
import { getSource } from '../utilities/annotation/annotation-utilities';
import { singleNumber } from '../utilities/binary-searchable-container/binary-search-utilities';

export interface ViewOptions extends BaseOpt<Node> {
    collection: Graph;
}

export default class AnnotationListView extends View<Node> {
    collection: Graph;
    summaryBlocks: ItemSummaryBlockView[];

    /**
     * Keep track of the currently highlighted summary block
     */
    currentlySelected: ItemSummaryBlockView;

    /**
     * A simple lookup hash with Annotation cid as key,
     * and ItemSummaryBlock as value
     */
    blockByModel: Map<string, ItemSummaryBlockView>

    constructor(options: ViewOptions) {
        super(options);
    }

    initialize(options): this {
        this.summaryBlocks = [];
        this.blockByModel = new Map();

        this.listenTo(this.collection, 'change', this.render);

        let initialSource;

        this.collection.each(node => {
            if (isType(node, oa.Annotation)) {
                let source = getSource(node);
                if (!initialSource) initialSource = source;
                if (source === initialSource) this.initSummaryBlock(node);
            }
        });

        this.listenTo(this.collection, 'add', this.add);
        return this;
    }

    initSummaryBlock(node: Node): this {
        if (isType(node, oa.Annotation)) {
            let view = new ItemSummaryBlockView({
                model: node
            });
            this.listenTo(view, 'click', this.onSummaryBlockClicked);
            this.listenTo(view, 'hover', this.onSummaryBlockedHover);
            if (view.positionDetails) {
                this.onPositionDetailsProcessed(view);
            }
            else {
                this.listenToOnce(view, 'positionDetailsProcessed', this.onPositionDetailsProcessed);
            }
            this.blockByModel.set(node.cid, view);
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
        return this.render();
    }

    /**
     * Insert a new summary block at the correct index (i.e. keep summary blocks sorted).
     * Will only work if the blocks have position details!
     */
    insertBlock(block: ItemSummaryBlockView): this {
        let index = sortedIndexBy(this.summaryBlocks, block, (block) => {
            return singleNumber(block.positionDetails.startNodeIndex, block.positionDetails.startCharacterIndex);
        });
        this.summaryBlocks.splice(index, 0, block);
        if (this.collection.length == this.summaryBlocks.length) this.render();
        return this;
    }

    scrollTo(annotation: Node): this {
        if (!annotation) return this;
        let scrollToBlock = this.getSummaryBlock(annotation);

        if (scrollToBlock) {
            let scrollableEl = this.$('.panel-content');
            let scrollTop = getScrollTop(scrollableEl, scrollToBlock.getTop(), scrollToBlock.getHeight());
            this.select(scrollToBlock);
            scrollableEl.animate({ scrollTop: scrollTop }, 800);
        }
        return this;
    }

    getSummaryBlock(annotation: Node): ItemSummaryBlockView {
        return this.blockByModel.get(annotation.cid);
    }

    /**
     * Process a click on an oa:Annotation in another view,
     * as if it were a click in the current view.
     */
    processClick(annotation): this {
        let block = this.getSummaryBlock(annotation);
        this.processSelection(block, annotation);
        return this;
    }

    /**
     * Process un/selecting summary blocks when user clicks an annotation.
     */
    processSelection(block: ItemSummaryBlockView, annotation: Node): this {
        let isNew = true;

        if (this.currentlySelected) {
            isNew = this.currentlySelected.cid !== block.cid;
            this.unSelect(this.currentlySelected);
            this.currentlySelected = undefined;
        }

        if (isNew) {
            this.select(block);
            this.scrollTo(annotation);
        }

        return this;
    }

    select(block: ItemSummaryBlockView): this {
        block.select();
        this.currentlySelected = block;
        return this
    }

    unSelect(block: ItemSummaryBlockView): this {
        block.unSelect();
        return this
    }

    onPositionDetailsProcessed(block: ItemSummaryBlockView): this {
        this.insertBlock(block);
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
        this.processSelection(summaryBlock, annotation);
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
