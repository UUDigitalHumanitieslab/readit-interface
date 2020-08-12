import { get } from 'lodash';

import { getLabelFromId } from '../utilities/utilities';
import explorerChannel from './radio';
import routePatterns from './route-patterns';

/**
 * Create an event handler that will report the route of the current
 * panel over the `explorerChannel`.
 * @param route Name of the route pattern (not the pattern itself)
 * @param path Property path relative to `this` to a `Node` from which the
 *             `':serial'` in the route pattern may be obtained.
 * @returns Function that will trigger 'currentRoute' on the `explorerChannel`.
 */
export function announceRoute(route: string, path: string[]) {
    const pattern = routePatterns[route];

    /**
     * The created event handler.
     * @this Panel view.
     * @fires Events#currentRoute
     */
    return function(): void {
        const serial = getLabelFromId(get(this, path));
        const route = pattern.replace(':serial', serial);

        /**
         * @event Event#currentRoute
         * @type {string, View}
         */
        explorerChannel.trigger('currentRoute', route, this);
    }
}
