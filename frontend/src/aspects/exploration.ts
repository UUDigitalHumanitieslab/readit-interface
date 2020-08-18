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
