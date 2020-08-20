import { isString } from 'lodash';

import channel from '../explorer/radio';
import executeRoute from '../explorer/route-parser';
import router from '../global/exploration-router';
import mainRouter from '../global/main-router';
import explorer from '../global/explorer-view';
import controller from '../global/explorer-controller';
import { ensureSources } from '../global/sources';

const browserHistory = window.history;

channel.on({
    'sourceview:showAnnotations': controller.reopenSourceAnnotations,
    'sourceview:hideAnnotations': controller.unlistSourceAnnotations,
    'sourceview:textSelected': controller.selectText,
    'annotationList:showAnnotation': controller.openSourceAnnotation,
    'annotationList:hideAnnotation': controller.closeSourceAnnotation,
    'annotationEditView:saveNew': controller.saveNewAnnotation,
    'annotationEditView:save': controller.saveAnnotation,
    'annotationEditView:close': controller.closeEditAnnotation,
    'lditem:showRelated': controller.listRelated,
    'lditem:showAnnotations': controller.listItemAnnotations,
    'lditem:showExternal': controller.listExternal,
    'lditem:editAnnotation': controller.editAnnotation,
    'lditem:editItem': controller.notImplemented,
    'relItems:itemClick': controller.openRelated,
    'relItems:edit': controller.editRelated,
    'externalItems:edit': controller.editExternal,
    'externalItems:edit-close': controller.closeEditExternal,
    'relItems:edit-close': controller.closeEditRelated,
    'source-list:click': controller.pushSourcePair,
    'searchResultList:itemClicked': controller.openSearchResult,
}, controller);
channel.on('currentRoute', (route, panel) => {
    router.navigate(route);
    // Amend the state that Backbone.history just pushed with the cid of the
    // panel.
    browserHistory.replaceState(panel.cid, document.title);
});

mainRouter.on('route:explore', () => ensureSources());

router.on('route', (route, [serial]) => {
    const state = browserHistory.state;
    // state can only be a string if we made it so.
    if (isString(state) && explorer.has(state)) {
        explorer.scroll(state);
    } else {
        executeRoute(route, controller, serial);
    }
});
