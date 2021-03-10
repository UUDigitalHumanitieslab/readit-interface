import { get } from 'lodash';

import { getLabelFromId } from '../utilities/linked-data-utilities';
import explorerChannel from '../explorer/explorer-radio';
import routePatterns from '../explorer/route-patterns';

// The part of the route patterns that we'll be replacing.
const stub = ':serial';

/**
 * Create an event handler that will report the route of the current
 * annotation or item panel over the `explorerChannel`.
 * @param edit `true` if this is an edit overlay, `false` otherwise.
 * @returns Function that will trigger 'currentRoute' on the `explorerChannel`.
 */
export function announceRoute(edit: boolean) {
    const itemPattern = routePatterns[edit ? 'item:edit' : 'item'];
    const annoPattern = routePatterns[edit ? 'annotation:edit': 'annotation'];

    /**
     * The created event handler.
     * @this Panel view.
     * @fires Events#currentRoute (possibly async)
     */
    function announce(): void {
        const model = this.model;
        if (!model.complete) {
            return this.listenToOnce(model, 'complete', announce);
        }

        let pattern: string;
        if (model.has('annotation')) {
            const sourceId = getLabelFromId(model.get('source').id);
            pattern = annoPattern.replace(stub, sourceId);
        } else {
            pattern = itemPattern;
        }
        const route = pattern.replace(stub, getLabelFromId(model.id));

        /**
         * @event Event#currentRoute
         * @type {string, View}
         */
        explorerChannel.trigger('currentRoute', route, this);
    }

    return announce;
}
