import { ViewOptions as BaseOpt, AddOptions } from 'backbone';
import { extend, sortedIndexBy } from 'lodash';
import View from '../core/view';

import { oa } from '../jsonld/ns';
import Node from '../jsonld/node';
import Graph from '../jsonld/graph';

import { isType, getScrollTop } from '../utilities/utilities';

import annotationsTemplate from './panel-annotation-list-template';
import ItemSummaryBlockView from '../utilities/item-summary-block/item-summary-block-view';
import { getSource } from '../utilities/annotation/annotation-utilities';
import { singleNumber } from './../utilities/binary-searchable-strategy/binary-search-utilities';
import LoadingSpinnerView from '../utilities/loading-spinner/loading-spinner-view';
import { SubviewBundleView } from '../utilities/subview-bundle-view';


export interface ViewOptions extends BaseOpt<Node> {
    ontology: Graph;
    collection: Graph;
}

export default class AnnotationListView extends View<Node> {
    collection: Graph;
    ontology: Graph;
    // summaryBlocks: ItemSummaryBlockView[];

    /**
     * Keep track of the currently highlighted summary block
     */
    currentlySelected: ItemSummaryBlockView;

    /**
     * Smart view to process large numbers of summary blocks / annotations.
     */
    subviewBundle: SubviewBundleView;

    /**
     * Have a loader ready to show when loading panels takes long.
     */
    loadingSpinnerView: LoadingSpinnerView;

    /**
     * Assume we will receive highlights
     */
    hasInitialHighlights: boolean = true;

    constructor(options: ViewOptions) {
        super(options);
    }

    initialize(options): this {
        if (!options.ontology) throw new TypeError('ontology cannot be null or undefined');
        this.ontology = options.ontology;
        this.subviewBundle = new SubviewBundleView(
            (view) => { return view.model.cid},
            (view) => {
                let block = view as ItemSummaryBlockView;
                return singleNumber(block.positionDetails.startNodeIndex, block.positionDetails.startCharacterIndex);
            }
        );

        let initialSource;

        this.collection.each(node => {
            if (isType(node, oa.Annotation)) {
                let source = getSource(node);
                if (!initialSource) initialSource = source;
                if (source === initialSource) this.initSummaryBlock(node);
            }
        });

        this.listenTo(this.collection, 'add', this.add);
        this.listenTo(this.collection, 'update', this.render);

        this.loadingSpinnerView = new LoadingSpinnerView();
        return this;
    }

    initSummaryBlocks(): this {
        this.collection.forEach(node => this.initSummaryBlock(node));
        this.render();
        return this;
    }

    initSummaryBlock(node: Node): this {
        if (isType(node, oa.Annotation)) {
            let view = new ItemSummaryBlockView({
                model: node,
                ontology: this.ontology
            });
            this.listenTo(view, 'click', this.onSummaryBlockClicked);
            this.listenTo(view, 'hover', this.onSummaryBlockedHover);
            if (view.positionDetails) {
                this.onPositionDetailsProcessed(view);
            }
            else {
                this.listenToOnce(view, 'positionDetailsProcessed', this.onPositionDetailsProcessed);
            }
        }
        return this;
    }

    render(): this {
        // TODO
        this.loadingSpinnerView.remove();
        this.subviewBundle.$el.detach();

        this.$el.html(this.template(this));

        let summaryList = this.$('.summary-list');
        if (this.hasInitialHighlights && this.subviewBundle.views.length < 1) {
            this.loadingSpinnerView.render().$el.appendTo(summaryList);
            this.loadingSpinnerView.activate();
        }
        else {
            this.subviewBundle.render().$el.appendTo(summaryList);
        }

        return this;
    }

    /**
     * Add a new block based on an annotation.
     */
    add(annotation: Node, collection: Graph): this {
        if (isType(annotation, oa.Annotation)) {
            this.initSummaryBlock(annotation);
        }
        return this;
    }

    /**
     * Insert a new summary block at the correct index (i.e. keep summary blocks sorted).
     * Will only work if the blocks have position details!
     */
    insertBlock(block: ItemSummaryBlockView): this {
        this.subviewBundle.addSubview(block);
        if (this.collection.length == this.subviewBundle.views.length) this.render();
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
        return this.subviewBundle.getViewBy(annotation.cid) as ItemSummaryBlockView;
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
     * Process the fact that no initial highlights exist.
     */
    processNoInitialHighlights(): this {
        this.hasInitialHighlights = false;
        return this.render();
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
