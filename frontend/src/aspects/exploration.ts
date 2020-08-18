import { isString } from 'lodash';

import channel from '../explorer/radio';
import router from '../global/exploration-router';
import explorer from '../global/explorer-view';
import '../global/explorer-controller';

const browserHistory = window.history;

channel.on('currentRoute', (route, panel) => {
    router.navigate(route);
    // Amend the state that Backbone.history just pushed with the cid of the
    // panel.
    browserHistory.replaceState(panel.cid, document.title);
});

router.on('route', (route, params) => {
    const state = browserHistory.state;
    // state can only be a string if we made it so.
    if (isString(state)) explorer.scroll(state);
});
