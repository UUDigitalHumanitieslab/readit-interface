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
import FlatModel from '../annotation/flat-annotation-model';
import FlatCollection from '../annotation/flat-annotation-collection';
import { AnnotationPositionDetails } from '../utilities/annotation/annotation-utilities';
import { oa, source } from '../jsonld/ns';
import SearchResultListView from '../search/search-results/panel-search-result-list-view';
import {
    isType,
    isOntologyClass,
} from '../utilities/utilities';
import SourceLanguageView from '../panel-source-list/source-language-view';

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
            'sourceview:showAnnotations': graph => defer(this.sourceViewShowAnnotations.bind(this), graph),
            'sourceview:hideAnnotations': this.sourceViewHideAnnotations,
            'sourceView:enlarge': this.sourceViewEnlarge,
            'sourceView:shrink': this.sourceViewShrink,
            'sourceview:textSelected': this.sourceViewOnTextSelected,
            'annotationList:showAnnotation': this.openAnnotationPanel,
            'annotationList:hideAnnotation': this.closeAnnotationPanel,
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
            'source-list:click': this.pushSourcePair,
            'searchResultList:itemClicked': this.searchResultListItemClicked,
        }, this);
    }

    pushSourcePair(basePanel: View, source: Node): [SourceView, AnnotationListView, Promise<void>] {
        const sourcePanel = createSourceView(source, true, true);
        const listPanel = new AnnotationListView({
            collection: sourcePanel.collection,
        });
        this.mapSourceAnnotationList.set(sourcePanel, listPanel);
        this.mapAnnotationListSource.set(listPanel, sourcePanel);
        const ready = this.explorerView.popUntilAsync(basePanel).then(() => {
            this.explorerView.push(sourcePanel).push(listPanel);
            sourcePanel.activate();
        });
        return [sourcePanel, listPanel, ready];
    }

    searchResultListItemClicked(searchResults: SearchResultListView, item: Node) {
        if (isType(item, oa.Annotation)) {
            const specificResource = item.get(oa.hasTarget)[0] as Node;
            const source = specificResource.get(oa.hasSource)[0] as Node;
            const [sourcePanel,,] = this.pushSourcePair(searchResults, source);
            const collection = sourcePanel.collection;
            collection.underlying.add(item);
            const flat = collection.get(item.id);
            sourcePanel.once('ready', () => flat.trigger('focus', flat));
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

    annotationEditSaveNew(editView: AnnotationEditView, annotation: FlatModel, created: ItemGraph): void {
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

    annotationListEdit(view: AnnotationListView, annotationList): this {
        this.notImplemented();
        return this;
    }

    openAnnotationPanel(listView: AnnotationListView, anno: FlatModel): void {
        const annoRDF = anno.get('annotation');
        let newDetailView = new LdItemView({ model: annoRDF });
        this.mapAnnotationListAnnotationDetail.set(listView, newDetailView);
        this.explorerView.popUntilAndPush(listView, newDetailView);
    }

    closeAnnotationPanel(listView: AnnotationListView, annotation: FlatModel): void {
        this.mapAnnotationListAnnotationDetail.delete(listView);
        this.explorerView.popUntil(listView);
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
        let annotationListView = new AnnotationListView({
            collection: sourceView.collection
        });
        sourceView.collection.underlying.sync();
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
        let annoEditView = new AnnotationEditView({
            range: range,
            positionDetails: positionDetails,
            source: source,
            ontology: this.explorerView.ontology,
            model: undefined,
            collection: sourceView.collection,
        });
        this.mapAnnotationEditSource.set(annoEditView, sourceView);

        if (listView) {
            annoEditView['_listview'] = listView;
            this.explorerView.popUntilAsync(listView).then(() => {
                this.explorerView.overlay(annoEditView);
            });
        }
        else {
            this.explorerView.push(annoEditView);
        }
        return this;
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

    let annotations = new FlatCollection(sourceItems);

    let sourceView = new SourceView({
        collection: annotations,
        model: source,
        showHighlightsInitially: showHighlightsInitially,
        isEditable: isEditable,
    });

    return sourceView;
}
