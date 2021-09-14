import { extend } from 'lodash';
import { Events } from 'backbone';

import View from '../core/view';
import Model from '../core/model';
import Collection from '../core/collection';
import Node from '../common-rdf/node';

import ExplorerView from './explorer-view';
import AnnotationView from '../panel-annotation/annotation-view';
import { asURI } from '../utilities/linked-data-utilities';
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
import { createPlaceholderAnnotation } from '../utilities/annotation-creation-utilities';
import { oa } from '../common-rdf/ns';
import SearchResultListView from '../panel-search-results/search-result-list-view';
import SourceListPanel from '../panel-source-list/source-list-panel';
import FilteredCollection from '../common-adapters/filtered-collection';
import {
    isOntologyClass,
} from '../utilities/linked-data-utilities';
import { itemsForSourceQuery } from '../sparql/compile-query';
import SemanticQuery from '../semantic-search/model';
import modelToQuery from '../semantic-search/modelToQuery';

interface ExplorerEventController extends Events { }
class ExplorerEventController {
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
        source.on('destroy', () => this.explorerView.popUntil(basePanel));
        return sourcePanel;
    }

    resetSource(source: Node, showHighlights: boolean): SourceView {
        const sourcePanel = createSourceView(source, showHighlights, true);
        this.explorerView.reset(sourcePanel);
        source.on('destroy', this.showSuggestionsPanel, this);
        return sourcePanel;
    }

    listSourceAnnotations(sourcePanel: SourceView): AnnotationListPanel {
        const listPanel = new AnnotationListPanel({
            model: sourcePanel.model,
            collection: sourcePanel.collection,
        });
        this.explorerView.push(listPanel);
        sourcePanel['_annotationListPanel'] = listPanel;
        return listPanel;
    }

    pushSourcePair(basePanel: View, source: Node): [SourceView, AnnotationListPanel] {
        const sourcePanel = this.pushSource(basePanel, source);
        const listPanel = this.listSourceAnnotations(sourcePanel);
        return [sourcePanel, listPanel];
    }

    resetSourcePair(source: Node): [SourceView, AnnotationListPanel] {
        const sourcePanel = this.resetSource(source, true);
        const listPanel = this.listSourceAnnotations(sourcePanel);
        return [sourcePanel, listPanel];
    }

    resetSourceListFromSearchResults(params: any) {
        const model = new Model(params);
        const sourceListPanel = new SourceListPanel({ model });
        this.explorerView.reset(sourceListPanel);
    }

    resetSemanticSearch(model: SemanticQuery): SearchResultListView {
        const items = new ItemGraph();
        model.when(
            'query',
            (model, query) => items.sparqlQuery(modelToQuery(query))
        );
        if (model.isNew()) model.save();
        const collection = new FlatItemCollection(items);
        const resultsView = new SearchResultListView({
            model,
            collection,
            selectable: false,
        });
        this.explorerView.reset(resultsView);
        return resultsView;
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
            sourcePanel.once('ready', () => {
                // `flat` represents the same underlying Node, but is a distinct
                // FlatItem from `result`, since they come from distinct
                // collections.
                const flat = collection.get(annotation.id);
                flat.trigger('focus', flat);
            });
        } else {
            const itemPanel = new AnnotationView({ model: result });
            this.explorerView.popUntil(searchResults).push(itemPanel);
            return itemPanel;
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
            object: item,
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

    editAnnotation(annotationPanel: AnnotationView, model: FlatItem): AnnoEditView {
        const { collection } = annotationPanel;
        const annoEditView = new AnnoEditView({ model, collection });
        this.explorerView.overlay(annoEditView, annotationPanel);
        // If the collection isn't complete yet, `openSourceAnnotation` will
        // probably re-focus, causing `annotationPanel` to be replaced. In that
        // case, we need to overlay again.
        if (collection && !collection.get(model)) {
            this.once('reopen-edit-annotation', this.editAnnotation);
        }
        return annoEditView;
    }

    makeNewAnnotation(annotationView: AnnotationView, annotation: FlatItem): AnnoEditView {
        const newAnnotation = createPlaceholderAnnotation(annotation);
        const collection = annotationView.collection;
        collection.underlying.add(newAnnotation);
        const model = collection.get(newAnnotation.id);
        const newAnnotationView = new AnnotationView({ model, collection });
        const newEditView = new AnnoEditView({ model, collection });
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
        annotation.trigger('focus', annotation);
        // TODO: re-enable the next line.
        // this.autoOpenRelationEditor(annotation.get('annotation'));
    }

    showAnnotationsOfCategory(view: SuggestionsView, category: FlatItem): SearchResultListView {
        let items = new ItemGraph();
        const url = '/item/' + (category.id as string).split("#")[1];
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
        const id = editView.model.id;
        if (id && !(id as string).startsWith('_:')) {
            this.explorerView.removeOverlay(editView);
        }
        else {
            this.explorerView.popUntil(editView).pop();
            this.explorerView.pop(); // also remove the underlying (empty) annotation view
        }
    }

    openSourceAnnotation(listView: AnnotationListPanel, model: FlatItem, annoCollection: Collection<FlatItem>): AnnotationView {
        const collection = annoCollection;
        let newDetailView = new AnnotationView({ model, collection });
        this.explorerView.popUntil(listView).push(newDetailView);
        // Focus might not work if the collection isn't complete yet. In that
        // case, re-focus when it is complete. This will cause
        // `openSourceAnnotation` to run again.
        if (!collection.get(model)) collection.once(
            'complete:all', () => collection.once('sort', () => {
                model = collection.get(model);
                model.trigger('focus', model);
            })
        );
        // Nobody is listening for the following event, except when we are
        // re-focusing as discussed above **and** the route ends in `/edit`.
        this.trigger('reopen-edit-annotation', newDetailView, model);
        return newDetailView;
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
        delete sourceView['_annotationListPanel'];
    }

    selectText(sourceView: SourceView, source: Node, range: Range, positionDetails: AnnotationPositionDetails): AnnoEditView {
        let listPanel = sourceView['_annotationListPanel'];
        if (!listPanel) {
            this.explorerView.popUntil(sourceView);
            listPanel = this.listSourceAnnotations(sourceView);
        }
        const collection = sourceView.collection;
        const annotation = createPlaceholderAnnotation(
            source, range, positionDetails
        );
        collection.underlying.add(annotation);
        const flat = collection.get(annotation.id);
        const newAnnotationView = this.openSourceAnnotation(listPanel, flat, collection);
        return this.editAnnotation(newAnnotationView, flat);
    }
}
extend(ExplorerEventController.prototype, Events);
export default ExplorerEventController;

/**
 * Get an ItemGraph with all oa:Annotations, oa:SpecificResources,
 * oa:TextQuoteSelectors and oa:TextPositionSelectors associated with the
 * specified source.
 */
export function getItems(source: Node): ItemGraph {
    const sparqlItems = new ItemGraph();
    let offsetMultiplier = 0;
    const limit = 10000;

    let queryString = itemsForSourceQuery(asURI(source), {});
    sparqlItems.sparqlQuery(queryString);
    return sparqlItems;
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
    let sourceItems = getItems(source);

    let annotations = new FlatAnnoCollection(sourceItems);

    let sourceView = new SourceView({
        collection: annotations,
        model: source,
        showHighlightsInitially: showHighlightsInitially,
        isEditable: isEditable,
    });

    return sourceView;
}
