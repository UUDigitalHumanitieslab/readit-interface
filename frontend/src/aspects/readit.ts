import { history, View } from 'backbone';
import { parallel, mapLimit } from 'async';
import footerView from '../global/footer-view';
import menuView from '../global/menu-view';
import welcomeView from '../global/welcome-view';
import ExplorerView from '../panel-explorer/explorer-view';

import Graph from './../jsonld/graph';
import Node from './../jsonld/node';
import { JsonLdObject } from './../jsonld/json';
import { item, readit, rdf, vocab } from '../jsonld/ns';

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

import ItemGraph from './../utilities/item-graph';
import SourceListView from '../panel-source-list/source-list-view';

history.once('route', () => {
    menuView.render().$el.appendTo('#header');
    footerView.render().$el.appendTo('.footer');
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

function getOntology(callback) {
    let o = new Graph();
    o.fetch({ url: readit() }).then(
        function success() {
            callback(null, o);
        },
        function error(collection, response, options: any) {
            callback(options.error)
        }
    );
}

function getAnnotations(specificResource: Node, callback: any) {
    const items = new ItemGraph();
    items.query({ predicate: oa.hasTarget, object: specificResource as Node }).then(
        function success() {
            callback(null, items.at(0));
        },
        function error(collection, response, options: any) {
            callback(options.error);
        }
    );
}

function getItems(source, itemCallback) {
    const specificResources = new ItemGraph();
    specificResources.query({ predicate: oa.hasSource, object: source }).then(
        function success() {
            mapLimit(specificResources.models, 4, (sr, cb) => getAnnotations(sr, cb), function (err, result) {
                itemCallback(null, result);
            });
        },
        function error(collection, response, options: any) {
            itemCallback(options.error);
        });
}

function getSources(callback) {
    const sources = new Graph();
    sources.fetch({
        url: '/source/',
        success: function succes() {
            callback(null, sources);
        },
        error: function error(collection, response, options: any) {
            callback(options.error);
        }
    });
}

function initExplorer(first: SourceListView, ontology: Graph): ExplorerView {
    let exView = new ExplorerView({ first: first, ontology: ontology });
    let vh = $(window).height();
    // compensates for menu and footer (555 is min-height)
    let height = Math.max(vh - 194, 555);
    exView.setHeight(height);
    exView.render().$el.appendTo('#main');
    return exView
}

function createSourceView(source: Node, ontology: Graph, callback: any) {
    getItems(source, function (error, items) {
        if (error) console.debug(error)
        else {
            let sourceView = new SourceView({
                collection: new Graph(items),
                model: source,
                ontology: ontology,
                showHighlightsInitially: true,
                isEditable: true,
                // initialScrollTo: annotation,
            });
            callback(null, sourceView);
        }
    });
}

directionFsm.on('enter:exploring', () => {
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
                createSourceView(source, ontology, (error, sourceView) => {
                    if (error) console.error(error);
                    else {
                        explorer.popUntil(sourceListView);
                        explorer.push(sourceView);
                    }
                });
            });
        }
    });
});

directionFsm.on('exit:exploring', () => {
    // exView.$el.detach();
});


directionRouter.on('route:leave', () => {
    console.log('not implemented!');
});
