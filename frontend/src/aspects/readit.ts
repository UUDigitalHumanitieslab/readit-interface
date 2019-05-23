import { history } from 'backbone';

import footerView from '../global/footer-view';
import menuView from '../global/menu-view';
import welcomeView from '../global/welcome-view';
import SourceView from './../source/source-view';
import ExplorerView from '../search/detail/explorer/explorer-view';

import Graph from './../jsonld/graph';
import Node from './../jsonld/node';
import { JsonLdObject } from './../jsonld/json';

import CategoryColorView from './../utilities/category-colors/category-colors-view';

import directionRouter from '../global/direction-router';
import userFsm from '../global/user-fsm';

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
    let ccView = new CategoryColorView({ collection: graph });
    ccView.render().$el.appendTo('.footer');

});

directionRouter.on('route:arrive', () => {
    let exView = new ExplorerView();
    exView.render().$el.appendTo('#main');
    // welcomeView.render().$el.appendTo('#main');
});
directionRouter.on('route:leave', () => {
    // welcomeView.$el.detach();
});
