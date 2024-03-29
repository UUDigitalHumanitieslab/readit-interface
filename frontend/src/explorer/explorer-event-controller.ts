import { extend, delay } from 'lodash';
import { Events } from 'backbone';
import * as i18next from 'i18next';

import View from '../core/view';
import Model from '../core/model';
import Collection from '../core/collection';
import Subject from '../common-rdf/subject';
import { oa, source } from '../common-rdf/ns';
import ldChannel from '../common-rdf/radio';

import ExplorerView from './explorer-view';
import AnnotationView from '../panel-annotation/annotation-view';
import { asURI } from '../utilities/linked-data-utilities';
import SourceView from '../panel-source/source-view';
import AnnotationListPanel from '../panel-annotation-list/annotation-list-panel';

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
import SearchResultListPanel from '../panel-search-results/search-result-list-panel';
import SourceListPanel from '../panel-source-list/source-list-panel';
import FilteredCollection from '../common-adapters/filtered-collection';
import {
    isOntologyClass,
    isBlank,
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

    pushSource(basePanel: View, source: Subject): SourceView {
        const sourcePanel = createSourceView(source, true, true);
        this.explorerView.popUntil(basePanel).push(sourcePanel);
        source.on('destroy', () => this.explorerView.popUntil(basePanel));
        return sourcePanel;
    }

    resetSource(source: Subject, showHighlights: boolean): SourceView {
        const sourcePanel = createSourceView(source, showHighlights, true);
        this.explorerView.reset(sourcePanel);
        source.on('destroy', this.resetBrowsePanel, this);
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

    pushSourcePair(basePanel: View, source: Subject): [SourceView, AnnotationListPanel] {
        const sourcePanel = this.pushSource(basePanel, source);
        const listPanel = this.listSourceAnnotations(sourcePanel);
        return [sourcePanel, listPanel];
    }

    resetSourcePair(source: Subject): [SourceView, AnnotationListPanel] {
        const sourcePanel = this.resetSource(source, true);
        const listPanel = this.listSourceAnnotations(sourcePanel);
        return [sourcePanel, listPanel];
    }

    resetSourceListFromSearchResults(params: any) {
        const model = new Model(params);
        const sourceListPanel = new SourceListPanel({ model });
        this.explorerView.reset(sourceListPanel);
    }

    resetSemanticSearch(model: SemanticQuery): SearchResultListPanel {
        const items = new ItemGraph();
        model.when(
            'query',
            (model, query) => items.sparqlQuery(modelToQuery(query)),
        );
        if (model.isNew()) model.save();
        const collection = new FlatItemCollection(items);
        const resultsView = new SearchResultListPanel({
            model,
            collection,
            selectable: false,
        });
        this.explorerView.reset(resultsView);
        return resultsView;
    }

    openSearchResult(
        searchResults: SearchResultListPanel,
        result: FlatItem
    ) {
        const annotation = result.get('annotation') as Subject;
        if (annotation || result.get('id').startsWith(source())) {
            const source = annotation? result.get('source') as Subject : result.get('item') as Subject;
            const [sourcePanel,] = this.pushSourcePair(searchResults, source);
            const collection = sourcePanel.collection;
            if (annotation) {
                sourcePanel.once('ready', () => {
                    // `flat` represents the same underlying Subject, but is a distinct
                    // FlatItem from `result`, since they come from distinct
                    // collections.
                    const flat = collection.get(annotation.id);
                    delay(() => flat.trigger('focus', flat), 250);
                });
            }
        } else {
            const itemPanel = new AnnotationView({ model: result });
            this.explorerView.popUntil(searchResults).push(itemPanel);
            return itemPanel;
        }
    }

    closeToRight(panel: View) {
        this.explorerView.popUntil(panel);
    }

    openRelated(relView: RelatedItemsView, item: Subject): AnnotationView {
        const itemPanel = new AnnotationView({ model: new FlatItem(item) });
        this.explorerView.popUntil(relView).push(itemPanel);
        return itemPanel;
    }

    editRelated(relView: RelatedItemsView, item: Subject): RelatedEditView {
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

    listRelated(view: AnnotationView, item: Subject): RelatedItemsView {
        const listView = new RelatedItemsView({ model: item });
        this.explorerView.popUntil(view).push(listView);
        return listView;
    }

    listItemAnnotations(view: AnnotationView, item: Subject): void {
        const items = new ItemGraph();
        items.query({
            predicate: oa.hasBody,
            object: item,
        }).catch(console.error);
        const flatItems = new FlatItemCollection(items);
        const filteredItems = new FilteredCollection(flatItems, 'annotation');
        const resultView = new SearchResultListPanel({
            title:i18next.t('annotation.list-title', 'Annotations'),
            model: item,
            collection: filteredItems,
            selectable: false,
        });
        this.explorerView.popUntil(view).push(resultView);
    }

    listExternal(view: AnnotationView, item: Subject): ExternalView {
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

    autoOpenRelationEditor(annotation: Subject): this {
        const newItems = (annotation.get(oa.hasBody) as Subject[])
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
        // `openSourceAnnotation` to run again. We delay the handler, because
        // sorting might or might not kick in one more time after complete:all.
        if (!collection.get(model)) {
            collection.once('complete:all', () => delay(() => {
                model = collection.get(model);
                model.trigger('focus', model);
            }, 250));
        }
        // Nobody is listening for the following event, except when we are
        // re-focusing as discussed above **and** the route ends in `/edit`,
        // **or** we are creating a new annotation because the user selected
        // text.
        this.trigger('reopen-edit-annotation', newDetailView, model);
        return newDetailView;
    }

    resetItem(item: Subject): AnnotationView {
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

    selectText(sourceView: SourceView, source: Subject, range: Range, positionDetails: AnnotationPositionDetails): AnnoEditView {
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
        flat.once('blur', () => {
            if (isBlank(annotation)) collection.underlying.remove(annotation);
        });
        let editPanel: AnnoEditView;
        this.once('reopen-edit-annotation', annoView =>
            editPanel = this.editAnnotation(annoView, flat)
        );
        // Through a cascade of synchronous events, the next trigger will invoke
        // `this.openSourceAnnotation`, which in turn will trigger the event
        // that causes `editPanel` to be set.
        flat.trigger('focus', flat);
        // Hence, `editPanel` is defined by the time this function returns.
        return editPanel;
    }

    resetBrowsePanel(queryMode: string | Model, landing: boolean) {
        if (queryMode instanceof Model) {
            // We came here from a source's 'destroy' handler.
            queryMode = 'sources';
            landing = false;
        }
        const title = `${landing ? 'My' : 'Sample'} ${queryMode}`;
        const i18nKey = `button.${title.toLowerCase().replace(' ', '-')}`;
        const endpoint = `${queryMode}:${landing ? 'user' : 'sample'}`;
        const collection = new FlatItemCollection(ldChannel.request(endpoint));
        const browsePanel = new SearchResultListPanel({
            // i18next.t('button.my-sources', 'My sources');
            // i18next.t('button.sample-sources', 'Sample sources');
            // i18next.t('button.my-items', 'My items');
            // i18next.t('button.sample-items', 'Sample items');
            title: i18next.t(i18nKey, title),
            collection,
            selectable: false,
        });
        return this.explorerView.reset(browsePanel);
    }
}
extend(ExplorerEventController.prototype, Events);
export default ExplorerEventController;

/**
 * Get an ItemGraph with all oa:Annotations, oa:SpecificResources,
 * oa:TextQuoteSelectors and oa:TextPositionSelectors associated with the
 * specified source.
 */
export function getItems(source: Subject): ItemGraph {
    const sparqlItems = new ItemGraph();
    const queryString = itemsForSourceQuery(asURI(source));
    sparqlItems.sparqlQuery(queryString);
    return sparqlItems;
}

/**
 * Create an instance of SourceView for the specified source.
 * Will collect the annotations associated with the source async, i.e.
 * these will be added to the SourceView's collection when ready.
 */
function createSourceView(
    source: Subject,
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
