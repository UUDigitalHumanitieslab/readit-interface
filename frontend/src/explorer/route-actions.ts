import View from '../core/view';
import { source, item as itemNs } from '../jsonld/ns';
import { Namespace } from '../jsonld/vocabulary';
import ldChannel from '../jsonld/radio';
import Node from '../jsonld/node';
import FlatItem from '../annotation/flat-item-model';

import Controller from './explorer-event-controller';

function obtainer<T extends readonly string[]>(namespace: Namespace<T>) {
    return function(serial: string) {
        return ldChannel.request('obtain', namespace(serial));
    }
}

export const getSource = obtainer(source);
export const getItem = obtainer(itemNs);

export function sourceWithoutAnnotations(control: Controller, node: Node) {
    return control.resetSource(node, false);
}

export function sourceWithAnnotations(control: Controller, node: Node) {
    return control.resetSourcePair(node);
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
