import { partial, isString } from 'lodash';

import channel from '../explorer/explorer-radio';
import * as act from '../explorer/route-actions';
import router from '../global/exploration-router';
import mainRouter from '../global/main-router';
import explorer from '../global/explorer-view';
import controller from '../global/explorer-controller';
import SuggestionsPanel from '../panel-suggestions/suggestions-view';
import welcomeView from '../global/welcome-view';

const browserHistory = window.history;
let suggestionsPanel: SuggestionsPanel;
function resetSuggestionsPanel() {
    suggestionsPanel = new SuggestionsPanel();
    explorer.reset(suggestionsPanel);
}

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
    explorer.scrollOrAction(suggestionsPanel && suggestionsPanel.cid, resetSuggestionsPanel);
});

router.on({
    'route:source:bare':            sourceRoute(act.sourceWithoutAnnotations),
    'route:source:annotated':       sourceRoute(act.sourceWithAnnotations),
    'route:item':                   itemRoute(act.item),
    'route:item:edit':              itemRoute(act.itemInEditMode),
    'route:item:related':           itemRoute(act.itemWithRelations),
    'route:item:related:edit':      itemRoute(act.itemWithEditRelations),
    'route:item:external':          itemRoute(act.itemWithExternal),
    'route:item:external:edit':     itemRoute(act.itemWithEditExternal),
    'route:item:annotations':       itemRoute(act.itemWithOccurrences),
    'route:search:results:sources': (fields, query) => explorer.scrollOrAction(
        browserHistory.state,
        () => act.searchResultsSources(controller, fields, query),
    ),
});

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
    'annotation:showRelated': controller.listRelated,
    'annotation:showAnnotations': controller.listItemAnnotations,
    'annotation:showExternal': controller.listExternal,
    'annotation:editAnnotation': controller.editAnnotation,
    'annotation:newAnnotation': controller.makeNewAnnotation,
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
