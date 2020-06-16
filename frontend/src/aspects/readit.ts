import { history, View } from 'backbone';
import footerView from '../global/footer-view';
import menuView from '../global/menu-view';
import welcomeView from '../global/welcome-view';
import feedbackView from './../global/feedback-view';
import ExplorerView from '../panel-explorer/explorer-view';

import user from './../global/user';

import Graph from './../jsonld/graph';
import Node from './../jsonld/node';
import { JsonLdObject } from './../jsonld/json';
import { item, readit, rdf, vocab, oa } from '../jsonld/ns';
import ldChannel from '../jsonld/radio';

import { getOntology, getSources } from './../utilities/utilities';

import CategoryColorView from './../utilities/category-colors/category-colors-view';
import SourceView from './../panel-source/source-view';

import directionRouter from '../global/direction-router';
import userFsm from '../global/user-fsm';
import directionFsm from '../global/direction-fsm';
import uploadSourceForm from './../global/upload-source-form';
import registrationFormView from './../global/registration-view';
import confirmRegistrationView from './../global/confirm-registration-view';

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
    menuView.on('feedback', () => { feedbackView.render().$el.appendTo('body'); });
    feedbackView.on('close', () => feedbackView.$el.detach());
    footerView.render().$el.appendTo('.footer');
});

directionRouter.on('route:register', () => {
    userFsm.handle('register');
});

directionRouter.on('route:confirm-registration', (key) => {
    user.on('confirm-registration:success', () => confirmRegistrationView.success());
    user.on('confirm-registration:notfound', () => confirmRegistrationView.notFound());
    user.on('confirm-registration:error', (response) => confirmRegistrationView.error(response));
    confirmRegistrationView.processKey(key);
    directionFsm.handle('confirm');
});

directionFsm.on('enter:confirming', () => {
    confirmRegistrationView.render().$el.appendTo('#main');
});

directionFsm.on('exit:confirming', () => {
    confirmRegistrationView.$el.detach();
});

directionRouter.on('route:arrive', () => {
    directionFsm.handle('arrive');
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
    // 133 is the height of the footer (got this number by manually testing)
    // Note that the same number needs to be the height of the 'push' class in main.sass
    return Math.max(vh - 160, 555);
}

function initExplorer(first: SourceListView): ExplorerView {
    explorerView = new ExplorerView({ first });
    explorerView.setHeight(getViewportHeight());
    explorerView.$el.appendTo('#main');
    return explorerView;
}

function initSourceList() {
    let ontology = ldChannel.request('ontology:graph');
    let sources =  new Graph();
    let sourceListView = new SourceListView({
        collection: sources
    });

    let explorerView = initExplorer(sourceListView);

    getSources(function (error, results) {
        if (error) console.debug(error);
        else {
            sources = results;
            sourceListView.collection.reset(sources.models);
            let ccView = new CategoryColorView({ collection: ontology});
            ccView.render().$el.appendTo('body');
            explorerView.render();
        }
    });
}
