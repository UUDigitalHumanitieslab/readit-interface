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

import mockLdItem from './../mock-data/mock-lditem';

history.once('route', () => {
    menuView.render().$el.appendTo('#header');
    footerView.render().$el.appendTo('.footer');

    let graph = new Graph([mockLdItem]);
    let ccView = new CategoryColorView({ collection: graph });
    ccView.render().$el.appendTo('.footer');

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
    let sourceView = new SourceView();

    let exView = new ExplorerView({ first: sourceView });
    let vh = $(window).height();
    // compensates for menu and footer (555 is min-height)
    let height = vh - 194 > 555 ? vh - 194 : 555;

    exView.setHeight(height);
    exView.render().$el.appendTo('#main');
});

directionFsm.on('exit:exploring', () => {
    // exView.$el.detach();
});


directionRouter.on('route:leave', () => {
    console.log('not implemented!');
});
