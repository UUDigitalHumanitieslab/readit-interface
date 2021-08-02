import { get } from 'lodash';
import { history, Model } from 'backbone';

import { getLabelFromId } from '../utilities/linked-data-utilities';
import explorerChannel from './explorer-radio';
import routePatterns from './route-patterns';

/**
 * Create an event handler that will report the route of the current
 * panel over the `explorerChannel`.
 * @param route Name of the route pattern (not the pattern itself)
 * @param path Property path relative to `this` to a `Node` from which the
 *             `':serial'` in the route pattern may be obtained.
 * @returns Function that will trigger 'currentRoute' on the `explorerChannel`.
 */
export function announceRoute(route: string, path?: string[]) {
    const pattern = routePatterns[route] || route;

    /**
     * The created event handler.
     * @this Panel view.
     * @fires Events#currentRoute
     */
    return function(): void {
        const pathResult = get(this, path, '');
        const serial = getLabelFromId(pathResult) || pathResult;
        const route = pattern.replace(':serial', serial);

        /**
         * @event Event#currentRoute
         * @type {string, View}
         */
        explorerChannel.trigger('currentRoute', route, this);
    }
}

/**
 * Reusable method for panel views to report that their `.model` doesn't exist.
 * Not all panels need to use this; only the leftmost (and bottom-most) panel
 * for each model in question.
 */
export function report404(model: Model): void {
    history.trigger('notfound');
    explorerChannel.trigger('notfound', this, model);
}
