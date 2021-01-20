import View from '../core/view';
import Model from '../core/model';
import Collection from '../core/collection';
import Node from '../common-rdf/node';
import userChannel from '../common-user/user-radio';

import ExplorerView from './explorer-view';
import AnnotationView from '../panel-annotation/annotation-view';
import ldChannel from '../common-rdf/radio';
import Graph from '../common-rdf/graph';
import SourceView from '../panel-source/source-view';
import AnnotationListPanel from '../panel-annotation-list/annotation-list-panel';
import SuggestionsView from '../panel-suggestions/suggestions-view';

import AnnoEditView from '../panel-annotation/annotation-edit-view';
import RelatedItemsView from '../panel-related-items/related-items-view';
import RelatedEditView from '../panel-related-items/related-items-edit-view';
import ExternalView from '../panel-external-resources/external-resources-view';
import ExternalEditView from '../panel-external-resources/external-resources-edit-view';
import ItemGraph from '../common-adapters/item-graph';
import FlatItem from '../common-adapters/flat-item-model';
import FlatItemCollection from '../common-adapters/flat-item-collection';
import FlatAnnoCollection from '../common-adapters/flat-annotation-collection';
import { AnnotationPositionDetails } from '../utilities/annotation-utilities';
import { oa } from '../common-rdf/ns';
import SearchResultListView from '../panel-search-results/search-result-list-view';
import SourceListPanel from '../panel-source-list/source-list-panel';
import FilteredCollection from '../common-adapters/filtered-collection';
import {
    isType,
    isOntologyClass,
} from '../utilities/linked-data-utilities';


export default class ExplorerEventController {
    /**
     * The explorer view instance to manage events for
     */
    explorerView: ExplorerView;

    constructor(explorerView: ExplorerView) {
        this.explorerView = explorerView;
    }

    pushSource(basePanel: View, source: Node): SourceView {
        const sourcePanel = createSourceView(source, true, true);
        this.explorerView.popUntil(basePanel).push(sourcePanel);
        return sourcePanel;
    }

    resetSource(source: Node, showHighlights: boolean): SourceView {
        const sourcePanel = createSourceView(source, showHighlights, true);
        this.explorerView.reset(sourcePanel);
        return sourcePanel;
    }

    listSourceAnnotations(sourcePanel: SourceView): AnnotationListPanel {
        const listPanel = new AnnotationListPanel({
            model: sourcePanel.model,
            collection: sourcePanel.collection,
        });
        this.explorerView.push(listPanel);
        return listPanel;
    }

    pushSourcePair(basePanel: View, source: Node): [SourceView, AnnotationListPanel] {
        const sourcePanel = this.pushSource(basePanel, source);
        const listPanel = this.listSourceAnnotations(sourcePanel);
        sourcePanel['_annotationListPanel'] = listPanel;
        return [sourcePanel, listPanel];
    }

    resetSourcePair(source: Node): [SourceView, AnnotationListPanel] {
        const sourcePanel = this.resetSource(source, true);
        const listPanel = this.listSourceAnnotations(sourcePanel);
        sourcePanel['_annotationListPanel'] = listPanel;
        return [sourcePanel, listPanel];
    }

    resetSourceListFromSearchResults(resultsCount: Model, query: string, fields: string) {
        const queryModel = new Model({ query, fields });
        const sourceListPanel = new SourceListPanel({ resultsCount: resultsCount, model: queryModel });
        this.explorerView.reset(sourceListPanel);
    }

    showSuggestionsPanel() {
        const suggestionsView = new SuggestionsView();
        this.explorerView.reset(suggestionsView);
    }

    openSearchResult(
        searchResults: SearchResultListView,
        result: FlatItem
    ) {
        const annotation = result.get('annotation') as Node;
        if (annotation) {
            const source = result.get('source') as Node;
            const [sourcePanel,] = this.pushSourcePair(searchResults, source);
            const collection = sourcePanel.collection;
            collection.underlying.add(annotation);
            // `flat` represents the same underlying Node, but is a distinct
            // FlatItem from `result`, since they come from distinct
            // collections.
            const flat = collection.get(annotation.id);
            sourcePanel.once('ready', () => flat.trigger('focus', flat));
        }
    }

    closeToRight(panel: View) {
        this.explorerView.popUntil(panel);
    }

    openRelated(relView: RelatedItemsView, item: Node): AnnotationView {
        const itemPanel = new AnnotationView({ model: new FlatItem(item) });
        this.explorerView.popUntil(relView).push(itemPanel);
        return itemPanel;
    }

    editRelated(relView: RelatedItemsView, item: Node): RelatedEditView {
        const editView = new RelatedEditView({ model: item });
        this.explorerView.overlay(editView, relView);
        return editView;
    }

    closeOverlay(panel: View): void {
        this.explorerView.removeOverlay(panel);
    }

    editExternal(exView: ExternalView): ExternalEditView {
        const editView = new ExternalEditView({ model: exView.model });
        this.explorerView.overlay(editView, exView);
        return editView;
    }

    listRelated(view: AnnotationView, item: Node): RelatedItemsView {
        const listView = new RelatedItemsView({ model: item });
        this.explorerView.popUntil(view).push(listView);
        return listView;
    }

    listItemAnnotations(view: AnnotationView, item: Node): void {
        const items = new ItemGraph();
        items.query({
            predicate: oa.hasBody,
            object: item ,
        }).catch(console.error);
        const flatItems = new FlatItemCollection(items);
        const filteredItems = new FilteredCollection(flatItems, 'annotation');
        const resultView = new SearchResultListView({
            model: item,
            collection: filteredItems,
            selectable: false,
        });
        this.explorerView.popUntil(view).push(resultView);
    }

    listExternal(view: AnnotationView, item: Node): ExternalView {
        const listView = new ExternalView({ model: item });
        this.explorerView.popUntil(view).push(listView);
        return listView;
    }

    editAnnotation(AnnotationView: AnnotationView, annotation: FlatItem): AnnoEditView {
        const annoEditView = new AnnoEditView({ model: annotation });
        this.explorerView.overlay(annoEditView, AnnotationView);
        return annoEditView;
    }

    makeNewAnnotation(annotationView: AnnotationView, annotation: FlatItem): AnnoEditView {
        const positionDetails = {
            startIndex: annotation.get('startPosition'),
            endIndex: annotation.get('endPosition')
        }
        let newEditView = new AnnoEditView({
            previousAnnotation: annotation,
            positionDetails: positionDetails,
            source: annotation.get('source'),
            collection: annotationView.collection,
        });
        const newAnnotationView = new AnnotationView({ model: newEditView.model })
        this.explorerView.popUntil(annotationView).pop();
        this.explorerView.push(newAnnotationView);
        this.explorerView.overlay(newEditView, newAnnotationView);
        return newEditView;
    }

    saveAnnotation(editView: AnnoEditView, annotation: FlatItem, newItem: boolean): void {
        this.explorerView.removeOverlay(editView);
        // TODO: re-enable the next line.
        // if (newItem) this.autoOpenRelationEditor(annotation.get('annotation'));
    }

    saveNewAnnotation(editView: AnnoEditView, annotation: FlatItem, created: ItemGraph): void {
        this.explorerView.removeOverlay(editView);
        editView.collection.once('sort', () => {
            annotation.trigger('focus', annotation);
        });
        // TODO: re-enable the next line.
        // this.autoOpenRelationEditor(annotation.get('annotation'));
    }

    showAnnotationsOfCategory(view: SuggestionsView, category: Node): SearchResultListView {
        let items = new ItemGraph();
        const url = '/item/' + category.id.split("#")[1];
        items.fetch({ url: url });
        let flatItems = new FlatItemCollection(items);
        const resultView = new SearchResultListView({
            model: category,
            collection: flatItems,
            selectable: false,
        });
        this.explorerView.popUntil(view).push(resultView);
        return resultView;
    }

    autoOpenRelationEditor(annotation: Node): this {
        const newItems = (annotation.get(oa.hasBody) as Node[])
            .filter(n => !isOntologyClass(n));
        if (newItems.length) {
            const item = newItems[0];
            const relView = new RelatedItemsView({ model: item });
            this.explorerView.push(relView);
            this.editRelated(relView, item);
        }
        return this;
    }

    closeEditAnnotation(editView: AnnoEditView): void {
        if (editView.model.id) {
            this.explorerView.removeOverlay(editView);
        }
        else {
            this.explorerView.popUntil(editView).pop();
            this.explorerView.pop(); // also remove the underlying (empty) annotation view
        }
    }

    openSourceAnnotation(listView: AnnotationListPanel, anno: FlatItem): void {
        let newDetailView = new AnnotationView({ model: anno, collection: listView.collection });
        this.explorerView.popUntil(listView).push(newDetailView);
    }

    resetItem(item: Node): AnnotationView {
        let detailView = new AnnotationView({ model: new FlatItem(item) });
        this.explorerView.reset(detailView);
        return detailView;
    }

    closeSourceAnnotation(listView: AnnotationListPanel, annotation: FlatItem): void {
        this.explorerView.popUntil(listView);
    }

    reopenSourceAnnotations(sourceView: SourceView): AnnotationListPanel {
        const annoListView = this.listSourceAnnotations(sourceView);
        sourceView.collection.underlying.trigger('sync');
        return annoListView;
    }

    unlistSourceAnnotations(sourceView): void {
        this.explorerView.popUntil(sourceView);
    }

    selectText(sourceView: SourceView, source: Node, range: Range, positionDetails: AnnotationPositionDetails): AnnoEditView {
        let annoEditView = new AnnoEditView({
            range: range,
            positionDetails: positionDetails,
            source: source,
            collection: sourceView.collection,
        });
        const panelToPopUntil = sourceView['_annotationListPanel'] ? sourceView['_annotationListPanel'] : sourceView;
        this.explorerView.popUntil(panelToPopUntil);
        const newAnnotationView = new AnnotationView({ model: annoEditView.model })
        this.explorerView.push(newAnnotationView);
        this.explorerView.overlay(annoEditView, newAnnotationView);
        return annoEditView;
    }
}

/**
 * Get an ItemGraph with all oa:Annotations, oa:SpecificResources,
 * oa:TextQuoteSelectors and oa:TextPositionSelectors associated with the
 * specified source.
 */
export function getItems(source: Node, callback): ItemGraph {
    const items = new ItemGraph();
    items.query({ object: source, traverse: 1, revTraverse: 1 }).then(
        function success() {
            callback(null, items);
        },
        /*error*/ callback
    );
    return items;
}

/**
 * Create an instance of SourceView for the specified source.
 * Will collect the annotations associated with the source async, i.e.
 * these will be added to the SourceView's collection when ready.
 */
function createSourceView(
    source: Node,
    showHighlightsInitially?: boolean,
    isEditable?: boolean,
): SourceView {
    let sourceItems = getItems(source, function(error, items) {
        if (error) console.debug(error);
    });

    let annotations = new FlatAnnoCollection(sourceItems);

    let sourceView = new SourceView({
        collection: annotations,
        model: source,
        showHighlightsInitially: showHighlightsInitially,
        isEditable: isEditable,
    });

    return sourceView;
}
