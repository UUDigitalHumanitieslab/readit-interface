import View from './../core/view';
import { defer } from 'lodash';
import Node from './../jsonld/node';

import ExplorerView from './explorer-view';
import LdItemView from '../panel-ld-item/ld-item-view';
import Graph from '../jsonld/graph';
import SourceView from './../panel-source/source-view';
import AnnotationListView from '../annotation/panel-annotation-list-view';

import AnnoEditView from '../annotation/panel-annotation-edit-view';
import RelatedItemsView from '../panel-related-items/related-items-view';
import RelatedEditView from '../panel-related-items/related-items-edit-view';
import ExternalView from '../panel-external-resources/external-resources-view';
import ExternalEditView from '../panel-external-resources/external-resources-edit-view';
import ItemGraph from '../utilities/item-graph';
import FlatItem from '../annotation/flat-item-model';
import FlatItemCollection from '../annotation/flat-item-collection';
import FlatAnnoCollection from '../annotation/flat-annotation-collection';
import { AnnotationPositionDetails } from '../utilities/annotation/annotation-utilities';
import { oa } from '../jsonld/ns';
import SearchResultListView from '../search/search-results/panel-search-result-list-view';
import FilteredCollection from '../utilities/filtered-collection';
import {
    isType,
    isOntologyClass,
} from '../utilities/utilities';

export default class ExplorerEventController {
    /**
     * The explorer view instance to manage events for
     */
    explorerView: ExplorerView;

    mapSourceAnnotationList: Map<SourceView, AnnotationListView> = new Map();
    mapAnnotationListSource: Map<AnnotationListView, SourceView> = new Map();
    mapAnnotationEditSource: Map<AnnoEditView, SourceView> = new Map();
    mapAnnotationListAnnotationDetail: Map<AnnotationListView, LdItemView> = new Map();

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

    listSourceAnnotations(sourcePanel: SourceView): AnnotationListView {
        const listPanel = new AnnotationListView({
            model: sourcePanel.model,
            collection: sourcePanel.collection,
        });
        this.mapSourceAnnotationList.set(sourcePanel, listPanel);
        this.mapAnnotationListSource.set(listPanel, sourcePanel);
        this.explorerView.push(listPanel);
        return listPanel;
    }

    pushSourcePair(basePanel: View, source: Node): [SourceView, AnnotationListView] {
        const sourcePanel = this.pushSource(basePanel, source);
        const listPanel = this.listSourceAnnotations(sourcePanel);
        return [sourcePanel, listPanel];
    }

    resetSourcePair(source: Node): [SourceView, AnnotationListView] {
        const sourcePanel = this.resetSource(source, true);
        const listPanel = this.listSourceAnnotations(sourcePanel);
        return [sourcePanel, listPanel];
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

    openRelated(relView: RelatedItemsView, item: Node): LdItemView {
        const itemPanel = new LdItemView({ model: item });
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

    listRelated(view: LdItemView, item: Node): RelatedItemsView {
        const listView = new RelatedItemsView({ model: item });
        this.explorerView.popUntil(view).push(listView);
        return listView;
    }

    listItemAnnotations(view: LdItemView, item: Node): void {
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

    listExternal(view: LdItemView, item: Node): ExternalView {
        const listView = new ExternalView({ model: item });
        this.explorerView.popUntil(view).push(listView);
        return listView;
    }

    editAnnotation(ldItemview: LdItemView, annotation: Node): AnnoEditView {
        let annoEditView = new AnnoEditView({
            model: new FlatItem(annotation)
        });
        this.explorerView.overlay(annoEditView, ldItemview);
        return annoEditView;
    }

    saveAnnotation(editView: AnnoEditView, annotation: FlatItem, newItem: boolean): void {
        this.explorerView.removeOverlay(editView);
        // TODO: re-enable the next line.
        // if (newItem) this.autoOpenRelationEditor(annotation.get('annotation'));
    }

    saveNewAnnotation(editView: AnnoEditView, annotation: FlatItem, created: ItemGraph): void {
        const listView = editView['_listview'];
        if (listView) {
            this.explorerView.removeOverlay(editView);
        } else {
            this.explorerView.pop();
        }
        editView.collection.once('sort', () => {
            annotation.trigger('focus', annotation);
        });
        // TODO: re-enable the next line.
        // this.autoOpenRelationEditor(annotation.get('annotation'));
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
        let source = this.mapAnnotationEditSource.get(editView);
        let annoList = this.mapSourceAnnotationList.get(source);
        if (annoList) {
            this.explorerView.removeOverlay(editView);
        } else {
            this.explorerView.pop();
        }
    }

    openSourceAnnotation(listView: AnnotationListView, anno: FlatItem): void {
        const annoRDF = anno.get('annotation');
        let newDetailView = new LdItemView({ model: annoRDF });
        this.mapAnnotationListAnnotationDetail.set(listView, newDetailView);
        this.explorerView.popUntil(listView).push(newDetailView);
    }

    resetItem(item: Node): LdItemView {
        let detailView = new LdItemView({ model: item });
        this.explorerView.reset(detailView);
        return detailView;
    }

    closeSourceAnnotation(listView: AnnotationListView, annotation: FlatItem): void {
        this.mapAnnotationListAnnotationDetail.delete(listView);
        this.explorerView.popUntil(listView);
    }

    reopenSourceAnnotations(sourceView: SourceView): AnnotationListView {
        const annoListView = this.listSourceAnnotations(sourceView);
        sourceView.collection.underlying.trigger('sync');
        return annoListView;
    }

    unlistSourceAnnotations(sourceView): void {
        let annoListView = this.mapSourceAnnotationList.get(sourceView);
        this.mapSourceAnnotationList.delete(sourceView);
        this.mapAnnotationListSource.delete(annoListView);
        this.explorerView.popUntil(sourceView);
    }

    selectText(sourceView: SourceView, source: Node, range: Range, positionDetails: AnnotationPositionDetails): AnnoEditView {
        let listView = this.mapSourceAnnotationList.get(sourceView);
        let annoEditView = new AnnoEditView({
            range: range,
            positionDetails: positionDetails,
            source: source,
            collection: sourceView.collection,
        });
        this.mapAnnotationEditSource.set(annoEditView, sourceView);

        if (listView) {
            annoEditView['_listview'] = listView;
            this.explorerView.popUntil(listView).overlay(annoEditView);
        } else {
            this.explorerView.push(annoEditView);
        }
        return annoEditView;
    }

    notImplemented() {
        alert('Sorry, not implemented yet!');
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
