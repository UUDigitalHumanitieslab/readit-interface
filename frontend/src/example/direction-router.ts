import Router from '../core/router';

const routes = {
    '(arrive)': 'arrive',
    'leave': 'leave',
};

export default class DirectionRouter extends Router {}

DirectionRouter.prototype.routes = routes;
