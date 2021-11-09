import { partial } from 'lodash';

import explorerChannel from '../explorer/explorer-radio';
import * as act from '../explorer/route-actions';
import semChannel from '../semantic-search/radio';
import deparam from '../utilities/deparam';
import router from '../global/exploration-router';
import explorer from '../global/explorer-view';
import controller from '../global/explorer-controller';
import welcomeView from '../global/welcome-view';
import '../global/annotation-hierarchy';
import '../global/annotation-settings';

const browserHistory = window.history;


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
const queryRoute = partial(deepRoute, deparam);
const semRoute = partial(deepRoute, act.getQuery);
function annoRoute(resetAction) {
    return (sourceSerial, itemSerial) => explorer.scrollOrAction(
        browserHistory.state,
        () => resetAction(
            controller,
            act.getSource(sourceSerial),
            act.getItem(itemSerial)
        )
    );
}

router.on({
    'route:source:bare':            sourceRoute(act.sourceWithoutAnnotations),
    'route:source:annotated':       sourceRoute(act.sourceWithAnnotations),
    'route:annotation':             annoRoute(act.annotation),
    'route:annotation:edit':        annoRoute(act.annotationInEditMode),
    'route:item':                   itemRoute(act.item),
    'route:item:edit':              itemRoute(act.itemInEditMode),
    'route:item:related':           itemRoute(act.itemWithRelations),
    'route:item:related:edit':      itemRoute(act.itemWithEditRelations),
    'route:item:external':          itemRoute(act.itemWithExternal),
    'route:item:external:edit':     itemRoute(act.itemWithEditExternal),
    'route:item:annotations':       itemRoute(act.itemWithOccurrences),
    'route:search:results:sources': queryRoute(act.searchResultsSources),
    'route:search:results:semantic': semRoute(act.searchResultsSemantic),
    'route:browse':                  partial(act.resetBrowsePanel, controller),
});

explorerChannel.on({
    'sourceview:showAnnotations': controller.reopenSourceAnnotations,
    'sourceview:hideAnnotations': controller.unlistSourceAnnotations,
    'sourceview:textSelected': controller.selectText,
    'annotationList:showAnnotation': controller.openSourceAnnotation,
    'annotationList:hideAnnotation': controller.closeSourceAnnotation,
    'annotationEditView:saveNew': controller.saveNewAnnotation,
    'annotationEditView:save': controller.saveAnnotation,
    'annotationEditView:close': controller.closeEditAnnotation,
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
explorerChannel.on('currentRoute', (route, panel) => {
    router.navigate(route);
    // Amend the state that Backbone.history just pushed with the cid of the
    // panel.
    browserHistory.replaceState(panel.cid, document.title);
});

semChannel.on('presentQuery', welcomeView.presentSemanticQuery, welcomeView);

welcomeView.on({
    'search:textual': controller.resetSourceListFromSearchResults,
    'search:semantic': controller.resetSemanticSearch,
}, controller);
