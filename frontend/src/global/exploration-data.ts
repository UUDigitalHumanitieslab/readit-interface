import { get, constant } from 'lodash';

import Model from '../core/model';
import { source, item } from '../common-rdf/ns';
import ldChannel from '../common-rdf/radio';
import userChannel from '../common-user/user-radio';
import ItemGraph from '../common-adapters/item-graph';
import SparqlSelectCollection from '../common-adapters/sparql-select-collection';
import {
    countNodesQuery,
    nodesByUserQuery,
    randomNodesQuery,
} from '../sparql/compile-query';

// Items and sources that the user may want to explore shortly after landing,
// either because they are her own or because she may not know them yet.
// These collections are initially empty, but we will take care of this in the
// `lazyTrigger` function.
const userItems = new ItemGraph();
const randomItems = new ItemGraph();
const userSources = new ItemGraph(source());
const randomSources = new ItemGraph(source());

// Helper collections that we use to determine the total numbers of items and
// sources in the backend triple store. Eventually, they will contain just a
// single model with just a single attribute, 'tally'.
const itemTally = new SparqlSelectCollection('item');
const sourceTally = new SparqlSelectCollection('source');

// The model containing the statistics that we want to show on the landing page.
// It will be updated when the above collections are fetched.
const statistics = new Model({
    totalItems: 0,
    totalSources: 0,
    userItems: 0,
    userSources: 0,
});

// Common pattern for registering an event handler in order to update one of the
// statistics fields above.
function trackStatistic(collection, event, sourceKey, targetKey) {
    collection.once(event, (payload) =>
        statistics.set(targetKey, get(payload, sourceKey))
    );
}

// Inside the single model in the tally collections, this is where we find the
// number we're interested in.
const tallyPath = ['attributes', 'tally', 'value'];

// Let's track those statistics!
trackStatistic(itemTally, 'add', tallyPath, 'totalItems');
trackStatistic(sourceTally, 'add', tallyPath, 'totalSources');
trackStatistic(userItems, 'update', 'length', 'userItems');
trackStatistic(userSources, 'update', 'length', 'userSources');

// Function factory that ensures a query to the backend is issued when one of
// our collections is first requested.
function lazyTrigger(collection, queryGen, onItems) {
    let trigger = () => collection.sparqlQuery(queryGen(onItems));
    return function() {
        if (trigger) {
            if (queryGen === nodesByUserQuery) {
                userChannel.request('promise').then(trigger);
            } else {
                trigger();
            }
            trigger = null;
        }
        return collection;
    }
}

// Issue one of the requests below in order to obtain one of the above
// collections, or the `statistics` model. Each of the collections has a
// `promise` property that you can await if you need it to be complete already,
// though it's probably best to just use a `CollectionView` in order to stay
// up-to-date. The `statistics` model will update 2 or 4 times; for the most
// accurate presentation, simply re-render whenever it changes.
ldChannel.reply({
    'items:tally': lazyTrigger(itemTally, countNodesQuery, true),
    'items:user': lazyTrigger(userItems, nodesByUserQuery, true),
    'items:sample': lazyTrigger(randomItems, randomNodesQuery, true),
    'sources:tally': lazyTrigger(sourceTally, countNodesQuery, false),
    'sources:user': lazyTrigger(userSources, nodesByUserQuery, false),
    'sources:sample': lazyTrigger(randomSources, randomNodesQuery, false),
    'statistics': constant(statistics),
});
