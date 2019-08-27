import { history } from 'backbone';

import footerView from '../global/footer-view';
import menuView from '../global/menu-view';
import welcomeView from '../global/welcome-view';
import ExplorerView from '../panel-explorer/explorer-view';

import Graph from './../jsonld/graph';
import Node from './../jsonld/node';
import { JsonLdObject } from './../jsonld/json';

import CategoryColorView from './../utilities/category-colors/category-colors-view';
import SourceView from './../panel-source/source-view';

import directionRouter from '../global/direction-router';
import userFsm from '../global/user-fsm';
import directionFsm from '../global/direction-fsm';

import mockOntology from './../mock-data/mock-ontology';
import mockItems from './../mock-data/mock-items';
import mockSourceText from './../mock-data/mock-source-text';

history.once('route', () => {
    menuView.render().$el.appendTo('#header');
    footerView.render().$el.appendTo('.footer');
    let ccView = new CategoryColorView({ collection: new Graph(mockOntology) });
    ccView.render().$el.appendTo('body');
});

directionRouter.on('route:arrive', () => {
    directionFsm.handle('arrive');
});

directionFsm.on('enter:arriving', () => {
    welcomeView.render().$el.appendTo('#main');
});

directionFsm.on('exit:arriving', () => {
    welcomeView.$el.detach();
});

directionRouter.on('route:explore', () => {
    directionFsm.handle('explore');
});

directionFsm.on('enter:exploring', () => {
    // This is just a quick and dirty solution, will have to be moved in the future

    let items = new Graph(mockItems);

    let scrollTo = items.find(n => n.get("@id") == "https://read-it.hum.uu.nl/item/102");

    let sourceView = new SourceView({
        items: items,
        sourceHTML: mockSourceText,
        inFullViewportMode: false,
        showHighlightsInitially: true,
        isEditable: true,
        initialScrollTo: scrollTo,
    });

    let exView = new ExplorerView({ first: sourceView });

    let vh = $(window).height();
    // compensates for menu and footer (555 is min-height)
    let height = Math.max(vh - 194, 555);

    exView.setHeight(height);
    exView.render().$el.appendTo('#main');
});

directionFsm.on('exit:exploring', () => {
    // exView.$el.detach();
});


directionRouter.on('route:leave', () => {
    console.log('not implemented!');
});
