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

import { getOntology, getSources, createSourceView } from './../utilities/utilities';

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

function initExplorer(first: SourceListView, ontology: Graph): ExplorerView {
    let exView = new ExplorerView({ first: first, ontology: ontology });
    let vh = $(window).height();
    // compensates for menu and footer (555 is min-height)
    let height = Math.max(vh - 194, 555);
    exView.setHeight(height);
    exView.render().$el.appendTo('#main');
    return exView;
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
                let sourceView = createSourceView(source, ontology, true, true);
                explorer.popUntil(sourceListView);
                explorer.push(sourceView);
            });
        }
    });
}
