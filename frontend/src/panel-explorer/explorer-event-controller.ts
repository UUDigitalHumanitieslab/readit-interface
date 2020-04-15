import View from './../core/view';
import { defer } from 'lodash';
import Node from './../jsonld/node';

import ExplorerView from './explorer-view';
import LdItemView from '../panel-ld-item/ld-item-view';
import Graph from '../jsonld/graph';
import SourceListView from '../panel-source-list/source-list-view';
import SourceView from './../panel-source/source-view';
import AnnotationListView from '../annotation/panel-annotation-list-view';

import AnnotationEditView from '../annotation/panel-annotation-edit-view';
import RelatedItemsView from '../panel-related-items/related-items-view';
import RelatedItemsEditView from '../panel-related-items/related-items-edit-view';
import ItemGraph from '../utilities/item-graph';
import { AnnotationPositionDetails } from '../utilities/annotation/annotation-utilities';
import { oa } from '../jsonld/ns';
import SearchResultListView from '../search/search-results/panel-search-result-list-view';
import {
    isType,
    isOntologyClass,
    createSourceView,
} from '../utilities/utilities';

export default class ExplorerEventController {
    /**
     * The explorer view instance to manage events for
     */
    explorerView: ExplorerView;

    mapSourceAnnotationList: Map<SourceView, AnnotationListView> = new Map();
    mapAnnotationListSource: Map<AnnotationListView, SourceView> = new Map();
    mapAnnotationEditSource: Map<AnnotationEditView, SourceView> = new Map();
    mapAnnotationListAnnotationDetail: Map<AnnotationListView, LdItemView> = new Map();

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
            'sourceView:noInitialHighlights': this.sourceViewNoInitialHighlights,
            'sourceview:highlightClicked': this.sourceViewHighlightClicked,
            'sourceview:highlightSelected': this.sourceViewHighlightSelected,
            'sourceview:highlightUnselected': this.sourceViewHighlightUnselected,
            'sourceview:highlightDeleted': this.sourceviewHighlightDeleted,
            'sourceview:showMetadata': this.sourceViewShowMetadata,
            'sourceview:hideMetadata': this.sourceViewHideMetadata,
            'sourceview:showAnnotations': (graph, finalizeNoInitialHighlights) => defer(this.sourceViewShowAnnotations.bind(this), graph, finalizeNoInitialHighlights),
            'sourceview:hideAnnotations': this.sourceViewHideAnnotations,
            'sourceView:enlarge': this.sourceViewEnlarge,
            'sourceView:shrink': this.sourceViewShrink,
            'sourceview:textSelected': this.sourceViewOnTextSelected,
            'annotation-listview:blockClicked': this.annotationListBlockClicked,
            'annotation-listview:edit': this.annotationListEdit,
            'annotationEditView:saveNew': this.annotationEditSaveNew,
            'annotationEditView:save': this.annotationEditSave,
            'annotationEditView:close': this.annotationEditClose,
            'lditem:showRelated': this.ldItemShowRelated,
            'lditem:showAnnotations': this.ldItemShowAnnotations,
            'lditem:showExternal': this.ldItemShowExternal,
            'lditem:editAnnotation': this.ldItemEditAnnotation,
            'lditem:editItem': this.notImplemented,
            'relItems:itemClick': this.relItemsItemClicked,
            'relItems:edit': this.relItemsEdit,
            'relItems:edit-close': this.relItemsEditClose,
            'source-list:click': this.sourceListClick,
            'searchResultList:itemClicked': this.searchResultListItemClicked,
        }, this);
    }

    sourceListClick(listView: SourceListView, source: Node): this {
        this.explorerView.popUntilAndPush(listView, () => createSourceView(source, true, true));
        return this;
    }

    searchResultListItemClicked(searchResultList: SearchResultListView, item: Node) {
        if (isType(item, oa.Annotation)) {
            const specificResource = item.get(oa.hasTarget)[0] as Node;
            let source = specificResource.get(oa.hasSource)[0] as Node;
            this.explorerView.popUntilAndPush(searchResultList, () => createSourceView(source, undefined, undefined, item));
        }
    }

    relItemsItemClicked(relView: RelatedItemsView, item: Node): this {
        this.explorerView.popUntilAndPush(relView, new LdItemView({ model: item }));
        return this;
    }

    relItemsEdit(relView: RelatedItemsView, item: Node): this {
        const editView = new RelatedItemsEditView({ model: item });
        this.explorerView.overlay(editView, relView);
        return this;
    }

    relItemsEditClose(editView: RelatedItemsEditView): this {
        this.explorerView.removeOverlay(editView);
        return this;
    }

    ldItemShowRelated(view: LdItemView, item: Node): this {
        if (!item) {
            alert('no related items!');
            return;
        }

        this.explorerView.popUntilAndPush(view, new RelatedItemsView({ model: item }));
        return this;
    }

    ldItemShowAnnotations(view: LdItemView, item: Node): this {
        if (!item) {
            alert('no linked annotations!');
            return;
        }

        let self = this;
        let items = new ItemGraph();
        this.explorerView.popUntilAsync(view).then(
            () => items.query({ predicate: oa.hasBody, object: item })
        ).then(
            function success() {
                let resultView = new SearchResultListView({ collection: new Graph(items.models), selectable: false });
                self.explorerView.push(resultView);
            },
            function error(error) {
                console.error(error);
            }
        );

        return this;
    }

    ldItemShowExternal(view: LdItemView, item: Node, externalResources: Node[]): this {
        this.explorerView.popUntil(view);
        this.notImplemented();
        return this;
    }

    ldItemEditAnnotation(ldItemview: LdItemView, annotation: Node): this {
        let annoEditView = new AnnotationEditView({
            ontology: this.explorerView.ontology,
            model: annotation,
        });
        this.explorerView.overlay(annoEditView, ldItemview);
        return this;
    }

    annotationEditSave(editView: AnnotationEditView, annotation: Node, newItem: boolean): this {
        this.explorerView.removeOverlay(editView);
        // TODO: re-enable the next line.
        // if (newItem) this.autoOpenRelationEditor(annotation);
        return this;
    }

    annotationEditSaveNew(editView: AnnotationEditView, annotation: Node, created: ItemGraph): this {
        let sourceView = this.mapAnnotationEditSource.get(editView);
        sourceView.add(created);

        let listView = this.mapSourceAnnotationList.get(sourceView);
        if (listView) {
            this.explorerView.removeOverlay(editView);
            // listView.collection.add(annotation);
        }
        else {
            this.explorerView.pop();
        }

        this.sourceViewHighlightClicked(sourceView, annotation);
        this.sourceViewHighlightSelected(sourceView, annotation);
        // TODO: re-enable the next line.
        // this.autoOpenRelationEditor(annotation);
        return this;
    }

    autoOpenRelationEditor(annotation: Node): this {
        const newItems = (annotation.get(oa.hasBody) as Node[])
            .filter(n => !isOntologyClass(n));
        if (newItems.length) {
            const item = newItems[0];
            const relView = new RelatedItemsView({ model: item });
            this.explorerView.push(relView);
            this.relItemsEdit(relView, item);
        }
        return this;
    }

    annotationEditClose(editView: AnnotationEditView): this {
        let source = this.mapAnnotationEditSource.get(editView);
        let annoList = this.mapSourceAnnotationList.get(source);
        if (annoList) this.explorerView.removeOverlay(editView);
        else this.explorerView.pop();
        return this;
    }

    annotationListBlockClicked(annotationList: AnnotationListView, annotation: Node): this {
        let sourceView = this.mapAnnotationListSource.get(annotationList);
        sourceView.processClick(annotation);
        return this;
    }

    annotationListEdit(view: AnnotationListView, annotationList): this {
        this.notImplemented();
        return this;
    }

    sourceViewHighlightClicked(sourceView: SourceView, annotation: Node): this {
        let annoListView = this.mapSourceAnnotationList.get(sourceView);
        annoListView.processClick(annotation);
        return this;
    }

    sourceViewHighlightSelected(sourceView: SourceView, annotation: Node): this {
        let annoListView = this.mapSourceAnnotationList.get(sourceView);
        let newDetailView = new LdItemView({ model: annotation });
        this.mapAnnotationListAnnotationDetail.set(annoListView, newDetailView);
        this.explorerView.popUntilAndPush(annoListView, newDetailView);
        return this;
    }

    sourceViewHighlightUnselected(sourceView: SourceView, annotation: Node, newHighlightSelected: boolean): this {
        let annoListView = this.mapSourceAnnotationList.get(sourceView);
        if (!newHighlightSelected) {
            this.mapAnnotationListAnnotationDetail.delete(annoListView);
            this.explorerView.popUntil(annoListView);
        }
        return this;
    }

    sourceviewHighlightDeleted(sourceView: SourceView, annotation: Node): this {
        let annoListView = this.mapSourceAnnotationList.get(sourceView);
        annoListView.removeAnno(annotation);
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

    sourceViewShowAnnotations(sourceView: SourceView, finalizeNoInitialHighlights: boolean = false): this {
        let annotationListView = new AnnotationListView({
            collection: sourceView.collection
        });
        if (finalizeNoInitialHighlights) annotationListView.finalizeNoInitialHighlights();
        this.mapSourceAnnotationList.set(sourceView, annotationListView);
        this.mapAnnotationListSource.set(annotationListView, sourceView);
        this.explorerView.push(annotationListView);
        return this;
    }

    sourceViewHideAnnotations(sourceView): this {
        let annoListView = this.mapSourceAnnotationList.get(sourceView);
        this.mapSourceAnnotationList.delete(sourceView);
        this.mapAnnotationListSource.delete(annoListView);
        this.explorerView.popUntil(sourceView);
        return this;
    }

    sourceViewOnTextSelected(sourceView: SourceView, source: Node, range: Range, positionDetails: AnnotationPositionDetails): this {
        let listView = this.mapSourceAnnotationList.get(sourceView);
        const createEditView = () => {
            let annoEditView = new AnnotationEditView({
                range: range,
                positionDetails: positionDetails,
                source: source,
                ontology: this.explorerView.ontology,
                model: undefined,
            });
            this.mapAnnotationEditSource.set(annoEditView, sourceView);
            return annoEditView;
        }

        if (listView) {
            this.explorerView.popUntilAsync(listView).then(() => {
                this.explorerView.overlay(createEditView());
            });
        } else {
            this.explorerView.push(createEditView());
        }
        return this;
    }

    sourceViewNoInitialHighlights(sourceView: SourceView): this {
        let listView = this.mapSourceAnnotationList.get(sourceView);
        listView.finalizeNoInitialHighlights();
        return this;
    }

    notImplemented() {
        alert('Sorry, not implemented yet!');
    }
}
