import { partial } from 'lodash';

import explorerChannel from '../explorer/explorer-radio';
import * as act from '../explorer/route-actions';
import semChannel from '../semantic-search/radio';
import deparam from '@dhl-uu/deparam';
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
// Double `partial`. We call the resulting function once to strip off the
// outermost `partial`, then again to actually invoke `act.resetBrowsePanel`.
const browseRoute = partial(partial, act.resetBrowsePanel, controller);
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
    // Disabling TS on the next two lines because something is off with the
    // `partial` typing.
    // @ts-ignore
    'route:browse:items':            browseRoute('items'),
    // @ts-ignore
    'route:browse:sources':          browseRoute('sources'),
    // Resuming TS from here on.
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
    'relItems:showItem': controller.openRelated,
    'relItems:hideItem': controller.closeToRight,
    'relItems:edit': controller.editRelated,
    'relItems:edit-close': controller.closeOverlay,
    'externalItems:edit': controller.editExternal,
    'externalItems:edit-close': controller.closeOverlay,
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
