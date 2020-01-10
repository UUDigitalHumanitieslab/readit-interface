import { history, View } from 'backbone';
import { parallel } from 'async';
import footerView from '../global/footer-view';
import menuView from '../global/menu-view';
import welcomeView from '../global/welcome-view';
import ExplorerView from '../panel-explorer/explorer-view';

import Graph from './../jsonld/graph';
import Node from './../jsonld/node';
import { JsonLdObject } from './../jsonld/json';
import { item, readit, rdf, vocab } from '../jsonld/ns';

import { getOntology, getSources, getItems } from './../utilities/utilities';

import CategoryColorView from './../utilities/category-colors/category-colors-view';
import SourceView from './../panel-source/source-view';

import directionRouter from '../global/direction-router';
import userFsm from '../global/user-fsm';
import directionFsm from '../global/direction-fsm';

import { oa } from './../jsonld/ns';

import mockOntology from './../mock-data/mock-ontology';
import mockItems from './../mock-data/mock-items';
import mockSources from './../mock-data/mock-sources';
import mockStaff from '../mock-data/mock-staff';
import LdItemView from '../panel-ld-item/ld-item-view';
import RelatedItemsView from '../panel-related-items/related-items-view';
import SearchResultBaseItemView from '../search/search-results/search-result-base-view';

import SourceListView from '../panel-source-list/source-list-view';
import LoadingSpinnerView from '../utilities/loading-spinner/loading-spinner-view';
import UploadSourceFormView from '../source/upload-source-view';

history.once('route', () => {
    menuView.render().$el.appendTo('#header');
    footerView.render().$el.appendTo('.footer');
});

directionRouter.on('route:arrive', () => {
    // userFsm.handle('arrive');
    welcomeView.render().$el.appendTo('#main');
});

userFsm.on('enter:arriving', () => {
    welcomeView.render().$el.appendTo('#main');
});

userFsm.on('exit:arriving', () => {
    welcomeView.$el.detach();
});

directionRouter.on('route:upload', () => {
    // userFsm.handle('upload');

    welcomeView.$el.detach();
    let view = new UploadSourceFormView();
    view.setHeight(getViewportHeight());
    view.render().$el.appendTo('#main');
});

userFsm.on('enter:uploading', () => {
    welcomeView.$el.detach();
    let view = new UploadSourceFormView();
    view.setHeight(getViewportHeight());
    view.render().$el.appendTo('#main');
});

userFsm.on('exit:uploading', () => {
});

userFsm.on('enter:exploring', () => {
    initSourceList();
});

userFsm.on('exit:exploring', () => {
});

directionRouter.on('route:explore', () => {
    // userFsm.handle('explore');
    welcomeView.$el.detach();
    initSourceList();
});

userFsm.on('enter:exploring', () => {
    initSourceList();
});

userFsm.on('exit:exploring', () => {
});


directionRouter.on('route:leave', () => {
    userFsm.handle('leave');
});

/**
 * Get the heigth of the available vertical space.
 * Compensates for menu and footer, and 555 is min-height.
 */
function getViewportHeight(): number {
    let vh = $(window).height();
    return Math.max(vh - 194, 555);
}

function initExplorer(first: SourceListView, ontology: Graph): ExplorerView {
    let exView = new ExplorerView({ first: first, ontology: ontology });
    exView.setHeight(getViewportHeight());
    exView.render().$el.appendTo('#main');
    return exView
}

function createSourceView(source: Node, callback: any) {
    getItems(source, function (error, items) {
        if (error) console.debug(error)
        else {
            let sourceView = new SourceView({
                collection: new Graph(items),
                model: source,
                showHighlightsInitially: true,
                isEditable: true,
                // initialScrollTo: annotation,
            });
            callback(null, sourceView);
        }
    });
}

function initSourceList() {
    parallel([getOntology, getSources], function (error, results) {
        if (error) console.debug(error);
        else {
            let ontology = results[0];
            let sources = results[1];

            let ccView = new CategoryColorView({ collection: ontology });
            ccView.render().$el.appendTo('body');

            let sourceListView = new SourceListView({
                collection: sources,
            });
            let explorer = initExplorer(sourceListView, ontology);

            sourceListView.on('source-list:click', (listView: SourceListView, source: Node) => {
                explorer.loadingSpinnerView.activate();
                createSourceView(source, (error, sourceView) => {
                    if (error) console.error(error);
                    else {
                        explorer.popUntil(sourceListView);
                        explorer.push(sourceView);
                    }
                });
            });
        }
    });
}
