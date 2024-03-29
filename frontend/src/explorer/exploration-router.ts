import { extend, invert } from 'lodash';

import Router from '../core/router';
import routePatterns from './route-patterns';

export default class ExplorationRouter extends Router {}

extend(ExplorationRouter.prototype, {
    routes: invert(routePatterns),
});
