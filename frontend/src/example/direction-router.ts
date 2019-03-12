import { extend } from 'lodash';

import Router from '../core/router';

export default class DirectionRouter extends Router {
    queryParams: any = {};

    search(queryParams: string) {
        this.queryParams = {};

        queryParams.split('&').forEach((param, index) => {
            let split = param.split("=");
            let key = split[0];
            let value = split[1];
            this.queryParams[key] = value
        })
    }
}

extend(DirectionRouter.prototype, {
    routes: {
        '(arrive)': 'arrive',
        'search/?(queryfields=:queryfields)(&query:=query)': 'search',
        'search/': 'search',
        'search/?query=:query&queryfields=:queryfields': 'search',
    },
});
