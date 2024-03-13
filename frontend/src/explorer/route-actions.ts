import View from '../core/view';
import { source, item as itemNs } from '../common-rdf/ns';
import { Namespace } from '../common-rdf/vocabulary';
import ldChannel from '../common-rdf/radio';
import Subject from '../common-rdf/subject';
import FlatItem from '../common-adapters/flat-item-model';
import semChannel from '../semantic-search/radio';
import SemanticQuery from '../semantic-search/model';

import Controller from './explorer-event-controller';

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

export function sourceWithoutAnnotations(control: Controller, node: Subject) {
    return control.resetSource(node, false);
}

export function sourceWithAnnotations(control: Controller, node: Subject) {
    return control.resetSourcePair(node);
}

export function annotation(control: Controller, source: Subject, item: Subject) {
    const [sourcePanel, listPanel] = sourceWithAnnotations(control, source);
    const flat = listPanel.collection.get(item.id) || new FlatItem(item);
    return control.openSourceAnnotation(listPanel, flat, listPanel.collection);
}

export
function annotationInEditMode(control: Controller, source: Subject, item: Subject) {
    const itemPanel = annotation(control, source, item);
    return control.editAnnotation(itemPanel, itemPanel.model);
}

export function item(control: Controller, node: Subject) {
    return control.resetItem(node);
}

export function itemInEditMode(control: Controller, node: Subject) {
    return control.editAnnotation(item(control, node), new FlatItem(node));
}

export function itemWithRelations(control: Controller, node: Subject) {
    return control.listRelated(item(control, node), node);
}

export function itemWithEditRelations(control: Controller, node: Subject) {
    return control.editRelated(itemWithRelations(control, node), node);
}

export function itemWithExternal(control: Controller, node: Subject) {
    return control.listExternal(item(control, node), node);
}

export function itemWithEditExternal(control: Controller, node: Subject) {
    return control.editExternal(itemWithExternal(control, node));
}

export function itemWithOccurrences(control: Controller, node: Subject) {
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
