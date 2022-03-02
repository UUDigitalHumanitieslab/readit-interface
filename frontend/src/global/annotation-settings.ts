/**
 * In this global, we provide default settings for annotation filters. The
 * settings take the form of two collections, one with members of the
 * annotation hierarchy (see ./annotation-hierarchy) that should be hidden and
 * one with members of that same hierarchy that should be collapsed (see
 * ../annotation-list-panel/filter-view). The default settings are based on the
 * user's most recently chosen settings, if those can be retrieved from
 * localStorage. Otherwise, they are based on the choices of the developer. A
 * clone of these collections can be obtained through a request to the explorer
 * radio channel.
 */

import { map, partial } from 'lodash';

import Model from '../core/model';
import Collection from '../core/collection';
import ldChannel from '../common-rdf/radio';
import { owl, skos } from '../common-rdf/ns';
import explorerChannel from '../explorer/explorer-radio';

import './ontology';

// The single sources of truth about the default settings.
const defaultHidden = new Collection();
const defaultCollapsed = new Collection();

// Corresponding localStorage keys.
const hiddenKey = 'annotation-filter-hidden';
const collapsedKey = 'annotation-filter-collapsed';

// JSON strings, potentially undefined.
const storedHidden = localStorage.getItem(hiddenKey);
const storedCollapsed = localStorage.getItem(collapsedKey);

// A bunch of helper functions for loading and storing (updated) settings. The
// first few probably speak for themselves.
const asModelId = id => ({ id } as Model);
const parseStored = text => map(JSON.parse(text), asModelId);
const serializeToStore = collection => JSON.stringify(collection.map('id'));
const savePreferences = (key, collection) => {
    localStorage.setItem(key, serializeToStore(collection));
};
const saveHidden = partial(savePreferences, hiddenKey, defaultHidden);
const saveCollapsed = partial(savePreferences, collapsedKey, defaultCollapsed);

// This helper function is a bit trickier: it is a closure factory that
// generates an event callback for us. The callback updates the single source of
// truth, `baseCollection`, with the updated contents of one of its clones,
// `this`, and then immediately saves to localStorage by calling the closed-over
// `save` function.
const adoptClone = (baseCollection, save) => function() {
    baseCollection.set(this.models);
    save();
};

// Time to actually populate the single sources of truth. Note that we "cheat" a
// little by not enforcing that the models in these collections actually come
// from the annotation hierarchy. We only use these collections and their clones
// to check whether a particular model is present, which can be done as long as
// the ids match. Taking this shortcut frees us from having to put the settings
// behind a promise.
if (storedHidden && storedCollapsed) {
    // We have previously stored settings available, so we just go with those
    // and be done with it.
    defaultHidden.set(parseStored(storedHidden));
    defaultCollapsed.set(parseStored(storedCollapsed));
} else {
    // Developer choices! We collapse top-level ontology classes and hide
    // preannotations, annotations made by other users and deprecated ontology
    // classes.
    const ontology = ldChannel.request('ontology:flatColored');
    defaultHidden.set(map(['others', 'nlp'], asModelId));
    ontology.once('complete:all', () => {
        // In theory, a user might already cause a filter view to be created
        // before this event handler is called. In that case, the settings below
        // will not take effect for that user. This is non-critical.
        ontology.each(flatCls => {
            const cls = flatCls.get('class');
            if (!cls.has(skos.related)) defaultCollapsed.add(flatCls);
            if (cls.has(owl.deprecated, true)) defaultHidden.add(flatCls);
        });
        // Save the defaults so we don't have to repeat this exercises (until
        // the user erases her localStorage).
        saveHidden();
        saveCollapsed();
    });
}

// Finally, we provide our services to the outside world. Client code gets
// clones of the defaults. The defaults will update with the clones but not the
// other way round.
explorerChannel.reply('filter-settings', () => {
    const hidden = defaultHidden.clone();
    const collapsed = defaultCollapsed.clone();
    hidden.on('update', adoptClone(defaultHidden, saveHidden));
    collapsed.on('update', adoptClone(defaultCollapsed, saveCollapsed));
    return { hidden, collapsed };
});
