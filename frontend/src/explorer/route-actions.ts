import View from '../core/view';
import { source, item as itemNs } from '../common-rdf/ns';
import { Namespace } from '../common-rdf/vocabulary';
import ldChannel from '../common-rdf/radio';
import Node from '../common-rdf/node';
import FlatItem from '../common-adapters/flat-item-model';
import semChannel from '../semantic-search/radio';
import SemanticQuery from '../semantic-search/model';

import Controller from './explorer-event-controller';
import Collection from '../core/collection';
import ItemGraph from '../common-adapters/item-graph';

function obtainer<T extends readonly string[]>(namespace: Namespace<T>) {
    return function(serial: string) {
        return ldChannel.request('obtain', namespace(serial));
    }
}

export const getSource = obtainer(source);
export const getItem = obtainer(itemNs);

export function getQuery(serial: string) {
    const model = semChannel.request('userQueries').add({ id: serial });
    model.fetch();
    return model;
}

export function sourceWithoutAnnotations(control: Controller, node: Node) {
    return control.resetSource(node, false);
}

export function sourceWithAnnotations(control: Controller, node: Node) {
    return control.resetSourcePair(node);
}

export function annotation(control: Controller, source: Node, item: Node) {
    const [sourcePanel, listPanel] = sourceWithAnnotations(control, source);
    const flat = listPanel.collection.get(item.id) || new FlatItem(item);
    return control.openSourceAnnotation(listPanel, flat, listPanel.collection);
}

export
function annotationInEditMode(control: Controller, source: Node, item: Node) {
    const itemPanel = annotation(control, source, item);
    return control.editAnnotation(itemPanel, itemPanel.model);
}

export function item(control: Controller, node: Node) {
    return control.resetItem(node);
}

export function itemInEditMode(control: Controller, node: Node) {
    return control.editAnnotation(item(control, node), new FlatItem(node));
}

export function itemWithRelations(control: Controller, node: Node) {
    return control.listRelated(item(control, node), node);
}

export function itemWithEditRelations(control: Controller, node: Node) {
    return control.editRelated(itemWithRelations(control, node), node);
}

export function itemWithExternal(control: Controller, node: Node) {
    return control.listExternal(item(control, node), node);
}

export function itemWithEditExternal(control: Controller, node: Node) {
    return control.editExternal(itemWithExternal(control, node));
}

export function itemWithOccurrences(control: Controller, node: Node) {
    // listItemAnnotations does not return the created panel
    // see #342
    control.listItemAnnotations(item(control, node), node);
}

export function searchResultsSources(control: Controller, queryParams: any) {
    return control.resetSourceListFromSearchResults(queryParams);
}

export function resetBrowsePanel(control: Controller, queryMode: string, landing: boolean) {
    return control.resetBrowsePanel(queryMode, landing);
}

export
function searchResultsSemantic(control: Controller, model: SemanticQuery) {
    model.when('query', () => semChannel.trigger('presentQuery', model));
    control.resetSemanticSearch(model);
}
