import { each } from 'lodash';

import Fsm from '../core/fsm';
import { source, item } from '../jsonld/ns';
import ldChannel from '../jsonld/radio';
import Controller from './explorer-event-controller';

const RouteParser = Fsm.extend({
    initialState: 'undecided',
    states: {
        undecided: {
            source: 'source',
            item: 'item',
        },
        source: {
            _onEnter() {
                this.source = ldChannel.request('obtain', source(this.serial));
            },
            bare: 'sourceWithoutAnnotations',
            annotated: 'sourceWithAnnotations',
        },
        sourceWithoutAnnotations: {
            _onEnter() {
                this.panel = this.controller.resetSource(source, false);
            },
        },
        sourceWithAnnotations: {
            _onEnter() {
                this.panel = this.controller.resetSourcePair(this.source);
            },
        },
        item: {
            _onEnter() {
                this.item = ldChannel.request('obtain', item(this.serial));
                this.panel = this.controller.resetItem(this.item);
            },
            edit: 'itemInEditMode',
            related: 'itemWithRelations',
            external: 'itemWithExternal',
            annotations: 'itemWithOccurrences',
        },
        itemInEditMode: {
            _onEnter() {
                this.panel = this.controller.editAnnotation(
                    this.panel, this.item
                );
            },
        },
        itemWithRelations: {
            _onEnter() {
                this.panel = this.controller.listRelated(this.panel, this.item);
            },
            edit: 'itemWithEditRelations',
        },
        itemWithEditRelations: {
            _onEnter() {
                this.panel = this.controller.editRelated(this.panel, this.item);
            },
        },
        itemWithExternal: {
            _onEnter() {
                this.panel = this.controller.listExternal(
                    this.panel, this.item
                );
            },
            edit: 'itemWithEditExternal',
        },
        itemWithEditExternal: {
            _onEnter() {
                this.panel = this.controller.editExternal(
                    this.panel, this.item
                );
            },
        },
        itemWithOccurrences: {
            _onEnter() {
                // listItemAnnotations does not return the created panel
                // see #342
                this.controller.listItemAnnotations(this.panel, this.item);
            },
        },
    },
});

export default function executeRoute(
    route: string,
    controller: Controller,
    serial: string
): void {
    const parser = new RouteParser({ controller, serial });
    const layers = route.split(':');
    each(layers, layer => parser.handle(layer));
}
