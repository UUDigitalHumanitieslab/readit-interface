/**
 * This module provides the full model hierarchy that is used for annotation
 * filtering. This uses the convention described in
 * ../hierarchy/hierarchy-view. The hierarchy is provided on the explorer radio
 * channel. The request name is 'filter-hierarchy' for a synchronous copy of
 * the hierarchy (potentially still empty), or 'filter-hierarchy:promise' for
 * an asynchronous copy that is guaranteed to be complete.
 */

import { each, constant } from 'lodash';

import Model from '../core/model';
import Collection from '../core/collection';
import ldChannel from '../common-rdf/radio';
import explorerChannel from '../explorer/explorer-radio';
import { i18nPromise, i18next } from './i18n';
import './ontology';
import './nlp-ontology';

// The hierarchy has two main branches, one for semantic annotations and one for
// preannotations. We keep direct handles to both because we need to append
// models to them later.
const semanticHierarchy = new Collection();
const nlpHierarchy = new Collection();
const fullHierarchy = new Collection();

// Main category labels need to be translated, so we await i18next readiness
// before starting to construct the main skeleton of the hierarchy.
const hierarchyPromise = i18nPromise.then(() => {
    semanticHierarchy.add([{
        model: new Model({
            label: i18next.t('filterHierarchy.mine', 'by me'),
            cssClass: 'rit-self-made',
        }),
    }, {
        model: new Model({
            label: i18next.t('filterHierarchy.others', 'by others'),
            cssClass: 'rit-other-made',
        }),
    }, {
        model: new Model({
            label: i18next.t('filterHierarchy.verified', 'verified'),
            cssClass: 'rit-verified',
        }),
    }, {
        model: new Model({
            label: i18next.t('filterHierarchy.unverified', 'unverified'),
            cssClass: 'rit-unverified',
        }),
    }]);

    fullHierarchy.add([{
        model: new Model({
            label: i18next.t('filterHierarchy.semantic', 'human'),
            cssClass: 'rit-is-semantic',
        }),
        collection: semanticHierarchy,
    }, {
        model: new Model({
            label: i18next.t('filterHierarchy.nlp', 'automated'),
            cssClass: 'rit-is-nlp',
        }),
        collection: nlpHierarchy,
    }]);

    // With the skeleton in place, we now proceed to append the ontology
    // hierarchies. These come as promises themselves, so we await those as
    // well.
    return Promise.all([
        ldChannel.request('ontology:hierarchy'),
        ldChannel.request('nlp-ontology:hierarchy'),
    ]);
}).then(([semanticCollection, nlpCollection]) => {
    semanticHierarchy.add(semanticCollection.models)
    nlpHierarchy.add(nlpCollection.models)
    return fullHierarchy;
});

// Sync: obtain the full hierarchy directly, even if it is still empty. If
// you're passing the hierarchy to something capable of handling a collection
// that may still receive data, this will be most convenient to you.
explorerChannel.reply('filter-hierarchy', constant(fullHierarchy));

// Async: obtain a promise that will resolve to the full hierarchy when it is
// complete. This may be useful if you need to be dead sure.
explorerChannel.reply('filter-hierarchy:promise', constant(hierarchyPromise));
