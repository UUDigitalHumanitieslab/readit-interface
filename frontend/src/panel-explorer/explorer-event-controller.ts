import View from './../core/view';
import { defer } from 'lodash';
import Node from './../jsonld/node';

import ExplorerView from './explorer-view';
import LdItemView from '../panel-ld-item/ld-item-view';
import Graph from '../jsonld/graph';
import SourceView from './../panel-source/source-view';
import AnnotationListView from '../annotation/panel-annotation-list-view';

import HighlightView from '../highlight/highlight-view';
import AnnotationEditView from '../annotation/panel-annotation-edit';
import RelatedItemsView from '../panel-related-items/related-items-view';

export default class ExplorerEventController {
    /**
     * The explorer view instance to manage events for
     */
    explorerView: ExplorerView;

    mapSourceAnnotationList: Map<SourceView, AnnotationListView> = new Map();
    mapAnnotationEditSource: Map<AnnotationEditView, SourceView> = new Map();

    constructor(explorerView: ExplorerView) {
        this.explorerView = explorerView;
    }

    /**
     * Subcribes to the events fired by the panel.
     * Contains a neat trick: will subscribe to all known events, most of which will never be
     * fired by the panel. No panel fires all different events.
     * @param panel The panel to listen to.
     */
    subscribeToPanelEvents(panel: View): void {
        panel.on({
            'sourceview:highlightSelected': this.sourceViewHighlightSelected,
            'sourceview:highlightUnselected': this.sourceViewHighlightUnselected,
            'sourceview:showMetadata': this.sourceViewShowMetadata,
            'sourceview:hideMetadata': this.sourceViewHideMetadata,
            'sourceview:showAnnotations': (graph) => defer(this.sourceViewShowAnnotations.bind(this), graph),
            'sourceview:hideAnnotations': this.sourceViewHideAnnotations,
            'sourceView:enlarge': this.sourceViewEnlarge,
            'sourceView:shrink': this.sourceViewShrink,
            'sourceview:textSelected': this.sourceViewOnTextSelected,
            'annotation-listview:blockClicked': this.annotationListBlockClicked,
            'annotation-listview:edit': this.annotationListEdit,
            'annotationEditView:save': this.annotationEditSave,
            'annotationEditView:close': this.annotationEditClose,
            'lditem:showRelated': this.ldItemShowRelated,
            'lditem:showAnnotations': this.ldItemShowAnnotations,
            'lditem:showExternal': this.ldItemShowExternal,
            'relItems:itemClick': this.relItemsItemClicked,
            'source-list:click': this.sourceListClick,
        }, this);
    }

    sourceListClick(source: Node): this {
        // TODO
        return this;
    }

    relItemsItemClicked(relView: RelatedItemsView, item: Node): this {
        this.explorerView.popUntil(relView);
        let itemView = new LdItemView({ model: item, ontology: this.explorerView.ontology });
        this.explorerView.push(itemView);
        return this;
    }

    ldItemShowRelated(view: LdItemView, item: Node): this {
        this.explorerView.popUntil(view);
        let relatedItems = new RelatedItemsView({ model: item, ontology: this.explorerView.ontology });
        this.explorerView.push(relatedItems);
        return this;
    }

    ldItemShowAnnotations(view: LdItemView, item: Node): this {
        this.explorerView.popUntil(view);
        this.notImplemented();
        return this;
    }

    ldItemShowExternal(view: LdItemView, item: Node, externalResources: Node[]): this {
        this.explorerView.popUntil(view);
        this.notImplemented();
        return this;
    }

    ldItemEdit(view: LdItemView, item: Node): this {
        this.explorerView.popUntil(view);
        this.notImplemented();
        return this;
    }

    annotationEditSave(editView: AnnotationEditView, annotation: Node): this {
        let sourceView = this.mapAnnotationEditSource.get(editView);
        sourceView.add(annotation);

        this.explorerView.removeOverlay(editView);

        let listView = this.mapSourceAnnotationList.get(sourceView);
        listView.collection.add(annotation);
        return this;
    }

    annotationEditClose(editView: AnnotationEditView): this {
        this.explorerView.removeOverlay(editView);
        return this;
    }

    annotationListBlockClicked(annotationList: AnnotationListView, annotation: Node): this {
        // The idea here is that the source view is in full control over which highlight is selected
        // The AnnotationListView simply passes each click on a summary block to the source view,
        // which then does what it always does (i.e. also highlight the relevant block in the list view)
        // In other words: the AnnotationListView doesn't throw any other events than click and doesn't select
        // anything itself.
        let sourceView : SourceView;
        this.mapSourceAnnotationList.forEach((value, key) => {
            if (value.cid === annotationList.cid) sourceView = key;
        });
        sourceView.scrollTo(annotation);
        return this;
    }

    annotationListEdit(view: AnnotationListView, annotationList: Graph): this {
        this.notImplemented();
        return this;
    }

    sourceViewHighlightSelected(sourceView: SourceView, annotation: Node): this {
        let itemView = new LdItemView({ model: annotation, ontology: this.explorerView.ontology });
        this.explorerView.push(itemView);

        let annoListView = this.mapSourceAnnotationList.get(sourceView);
        annoListView.scrollTo(annotation);
        return this;
    }

    sourceViewHighlightUnselected(sourceView: SourceView, annotation: Node): this {
        let annoListView = this.mapSourceAnnotationList.get(sourceView);
        this.explorerView.popUntil(annoListView);
        annoListView.unSelectAnno(annotation);
        return this;
    }

    sourceViewShowMetadata(sourceView: View, node: Node): this {
        this.explorerView.popUntil(sourceView);
        this.notImplemented();
        return this;
    }

    sourceViewHideMetadata(sourceView: View): this {
        // this.explorerView.popUntil(sourceView);
        return this;
    }

    sourceViewEnlarge(sourceView: View): this {
        this.explorerView.popUntil(sourceView);
        this.notImplemented();
        return this;
    }

    sourceViewShrink(sourceView: View): this {
        return this;
    }

    sourceViewShowAnnotations(sourceView: SourceView): this {
        if (this.explorerView.stacks.length >= 2 && this.mapSourceAnnotationList.has(sourceView)) {
            this.explorerView.popUntil(this.mapSourceAnnotationList.get(sourceView));
        }
        else {
            let annotationsView = new AnnotationListView({
                collection: sourceView.collection as Graph, ontology: this.explorerView.ontology
            });

            this.mapSourceAnnotationList.set(sourceView, annotationsView);
            this.explorerView.push(annotationsView);
        }
        return this;
    }

    sourceViewHideAnnotations(sourceView): this {
        this.mapSourceAnnotationList.delete(sourceView);
        this.explorerView.popUntil(sourceView);
        return this;
    }

    sourceViewOnTextSelected(sourceView: SourceView, annotation: Node): this {
        let listView = this.mapSourceAnnotationList.get(sourceView);
        this.explorerView.popUntil(listView);

        let annoEditView = new AnnotationEditView({ model: annotation, ontology: this.explorerView.ontology });
        this.mapAnnotationEditSource.set(annoEditView, sourceView);
        this.explorerView.overlay(annoEditView);
        return this;
    }

    notImplemented() {
        alert('Sorry, not implemented yet!');
    }
}
