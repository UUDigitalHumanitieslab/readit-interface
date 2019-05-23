import { history } from 'backbone';

import footerView from '../global/footer-view';
import menuView from '../global/menu-view';
import welcomeView from '../global/welcome-view';
import ExplorerView from '../panel-explorer/explorer-view';

import Graph from './../jsonld/graph';
import Node from './../jsonld/node';
import { JsonLdObject } from './../jsonld/json';

import CategoryColorView from './../utilities/category-colors/category-colors-view';

import directionRouter from '../global/direction-router';
import userFsm from '../global/user-fsm';
import directionFsm from '../global/direction-fsm';

history.once('route', () => {
    menuView.render().$el.appendTo('#header');
    footerView.render().$el.appendTo('.footer');

    // Create some css. This is jst a quick and dirty solution, will have to be moved in the future
    let attributes: JsonLdObject = {
        '@id': '3',
        "@type": [
            { '@id': "rdfs:Class" }
        ],
        'skos:prefLabel': [
            { '@value': 'Content' },
        ],
        'schema:color': 'hotpink',
        'skos:definition': [
            { '@value': 'Dit is de definitie van content' },
        ],
    }
    let node = new Node(attributes);
    let graph = new Graph([node]);

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

// This is jst a quick and dirty solution, will have to be moved in the future
let exView = new ExplorerView();

directionFsm.on('enter:exploring', () => {
    exView.render().$el.appendTo('#main');
});

directionFsm.on('exit:exploring', () => {
    // exView.$el.detach();
});


directionRouter.on('route:leave', () => {
    console.log('not implemented!');
});
