import { partial, isString } from 'lodash';

import channel from '../explorer/explorer-radio';
import * as act from '../explorer/route-actions';
import router from '../global/exploration-router';
import mainRouter from '../global/main-router';
import explorer from '../global/explorer-view';
import controller from '../global/explorer-controller';
import suggestionsPanel from '../global/suggestions-view';
import welcomeView from '../global/welcome-view';

const browserHistory = window.history;
const resetSuggestionsPanel = () => explorer.reset(suggestionsPanel);
/**
 * Common patterns for the explorer routes.
 */
function deepRoute(obtainAction, resetAction) {
    return (serial) => explorer.scrollOrAction(
        browserHistory.state,
        () => resetAction(controller, obtainAction(serial))
    );
}
const sourceRoute = partial(deepRoute, act.getSource);
const itemRoute = partial(deepRoute, act.getItem);

mainRouter.on('route:explore', () => {
    explorer.scrollOrAction(suggestionsPanel.cid, resetSuggestionsPanel);
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
    'category:showRelevantAnnotations': controller.showAnnotationsOfCategory,
    'lditem:showRelated': controller.listRelated,
    'lditem:showAnnotations': controller.listItemAnnotations,
    'lditem:showExternal': controller.listExternal,
    'lditem:editAnnotation': controller.editAnnotation,
    'relItems:itemClick': controller.openRelated,
    'relItems:edit': controller.editRelated,
    'externalItems:edit': controller.editExternal,
    'externalItems:edit-close': controller.closeOverlay,
    'relItems:edit-close': controller.closeOverlay,
    'source-list:click': controller.pushSourcePair,
    'searchResultList:itemClicked': controller.openSearchResult,
    'searchResultList:itemClosed': controller.closeToRight,
}, controller);
channel.on('currentRoute', (route, panel) => {
    router.navigate(route);
    // Amend the state that Backbone.history just pushed with the cid of the
    // panel.
    browserHistory.replaceState(panel.cid, document.title);
});
welcomeView.on({'search:start': controller.resetSourceListFromSearchResults}, controller);
welcomeView.on({'suggestions:show': controller.showSuggestionsPanel}, controller);
