import { history } from 'backbone';

import footerView from '../global/footer-view';
import menuView from '../global/menu-view';
import welcomeView from '../global/welcome-view';
import SourceView from './../source/source-view';
import ExplorerView from '../search/detail/explorer/explorer-view';

import Graph from './../jsonld/graph';
import Node from './../jsonld/node';
import { JsonLdObject } from './../jsonld/json';

import CategoryColourView from './../style/category_colours/category-colours-view';

import directionRouter from '../global/direction-router';
import directionFsm from '../global/direction-fsm';

history.once('route', () => {
    menuView.render().$el.appendTo('#header');
    footerView.render().$el.appendTo('.footer');

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
    let graph = new Graph();
    graph.push(node);
    let ccView = new CategoryColourView({ collection: graph });
    ccView.render().$el.appendTo('.footer');

});

directionRouter.on('route:arrive', () => directionFsm.handle('arrive'));
directionRouter.on('route:leave', () => directionFsm.handle('leave'));

directionFsm.on('enter:arriving', () => {
    let exView = new ExplorerView();
    exView.render().$el.appendTo('#main');
    // welcomeView.render().$el.appendTo('#main');
});
directionFsm.on('exit:arriving', () => {
    // welcomeView.$el.detach();
});
