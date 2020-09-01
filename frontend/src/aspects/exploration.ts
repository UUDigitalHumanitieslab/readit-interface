import { partial, isString } from 'lodash';

import channel from '../explorer/radio';
import * as act from '../explorer/route-actions';
import router from '../global/exploration-router';
import mainRouter from '../global/main-router';
import explorer from '../global/explorer-view';
import controller from '../global/explorer-controller';
import { ensureSources } from '../global/sources';
import sourceListPanel from '../global/source-list-view';
import welcomeView from '../global/welcome-view';

const browserHistory = window.history;
const resetSourceList = () => explorer.reset(sourceListPanel);

/**
 * Common patterns for the explorer routes.
 */
function deepRoute(obtainAction, resetAction) {
    return ([serial]) => explorer.scrollOrAction(
        browserHistory.state,
        () => resetAction(controller, obtainAction(serial))
    );
}
const sourceRoute = partial(deepRoute, act.getSource);
const itemRoute = partial(deepRoute, act.getItem);

mainRouter.on('route:explore', () => {
    ensureSources();
    explorer.scrollOrAction(sourceListPanel.cid, resetSourceList);
});

router.on('route:source:bare',       sourceRoute(act.sourceWithoutAnnotations));
router.on('route:source:annotated',  sourceRoute(act.sourceWithAnnotations));
router.on('route:item',                itemRoute(act.item));
router.on('route:item:edit',           itemRoute(act.itemInEditMode));
router.on('route:item:related',        itemRoute(act.itemWithRelations));
router.on('route:item:related:edit',   itemRoute(act.itemWithEditRelations));
router.on('route:item:external',       itemRoute(act.itemWithExternal));
router.on('route:item:external:edit',  itemRoute(act.itemWithEditExternal));
router.on('route:item:annotations',    itemRoute(act.itemWithOccurrences));

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
    'searchResultList:itemClicked': controller.openSearchResult
}, controller);
channel.on('currentRoute', (route, panel) => {
    router.navigate(route);
    // Amend the state that Backbone.history just pushed with the cid of the
    // panel.
    browserHistory.replaceState(panel.cid, document.title);
});
welcomeView.on({'search:searched': controller.resetSourceListFromSearchResults}, controller);
