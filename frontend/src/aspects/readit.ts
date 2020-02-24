import { history, View } from 'backbone';
import { parallel } from 'async';
import footerView from '../global/footer-view';
import menuView from '../global/menu-view';
import welcomeView from '../global/welcome-view';
import ExplorerView from '../panel-explorer/explorer-view';

import user from './../global/user';

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
import uploadSourceForm from './../global/upload-source-form';
import registrationFormView from './../global/registration-view';

import { oa } from './../jsonld/ns';

import mockOntology from './../mock-data/mock-ontology';
import mockItems from './../mock-data/mock-items';
import mockSources from './../mock-data/mock-sources';
import mockStaff from '../mock-data/mock-staff';
import LdItemView from '../panel-ld-item/ld-item-view';
import RelatedItemsView from '../panel-related-items/related-items-view';
import SearchResultBaseItemView from '../search/search-results/search-result-base-view';

import SourceListView from '../panel-source-list/source-list-view';

let explorerView;

history.once('route', () => {
    menuView.render().$el.appendTo('#header');
    footerView.render().$el.appendTo('.footer');
});

directionRouter.on('route:register', () => {
    directionFsm.handle('register');
});

directionFsm.on('enter:registering', () => {
    registrationFormView.render().$el.appendTo('body');
    user.on('registration:success', () => registrationFormView.success());
    user.on('registration:error', (response) => registrationFormView.error(response));
    user.on('registration:invalid', (errors) => registrationFormView.invalid(errors));
});

directionFsm.on('exit:registering', () => {
    registrationFormView.$el.detach();
});

directionRouter.on('route:arrive', () => {
    userFsm.handle('arrive');
});

userFsm.on('enter:arriving', () => {
    welcomeView.render().$el.appendTo('#main');
});

userFsm.on('exit:arriving', () => {
    welcomeView.$el.detach();
});

directionRouter.on('route:upload', () => {
    userFsm.handle('upload');
});

userFsm.on('enter:uploading', () => {
    uploadSourceForm.setHeight(getViewportHeight());
    uploadSourceForm.render().$el.appendTo('#main');
});

userFsm.on('exit:uploading', () => {
    uploadSourceForm.reset();
    uploadSourceForm.$el.detach();
});

directionRouter.on('route:explore', () => {
    userFsm.handle('explore');
});

userFsm.on('enter:exploring', () => {
    welcomeView.$el.detach();
    initSourceList();
});

userFsm.on('exit:exploring', () => {
    if (explorerView) explorerView.$el.detach();
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
    return Math.max(vh - 158, 555);
}

function initExplorer(first: SourceListView, ontology: Graph): ExplorerView {
    explorerView = new ExplorerView({ first: first, ontology: ontology });
    explorerView.setHeight(getViewportHeight());
    explorerView.render().$el.appendTo('#main');
    return explorerView;
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
                let sourceView = createSourceView(source, true, true);
                explorer.popUntil(sourceListView);
                explorer.push(sourceView);
            });
        }
    });
}
