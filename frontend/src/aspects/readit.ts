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
import mockGraph from './../mock-data/mock-graph';
import * as mockGraphSeparated from './../mock-data/mock-graph';

history.once('route', () => {
    menuView.render().$el.appendTo('#header');
    footerView.render().$el.appendTo('.footer');

    let ccView = new CategoryColorView({ collection: mockGraph });
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
    let mockSource = mockGraphSeparated.getSpecificResource();
    let mockAnno = mockGraphSeparated.getTextPositionSelector();

    // This is just a quick and dirty solution, will have to be moved in the future
    let sourceView = new SourceView({ model: mockSource, highlight: mockAnno});

    let exView = new ExplorerView({ first: sourceView });
    exView.render().$el.appendTo('#main');
});

directionFsm.on('exit:exploring', () => {
    // exView.$el.detach();
});


directionRouter.on('route:leave', () => {
    console.log('not implemented!');
});
