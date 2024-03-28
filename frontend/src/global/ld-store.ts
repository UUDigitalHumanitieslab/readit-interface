import { after, once } from 'lodash';

import {
    rdf,
    rdfs,
    skos,
    owl,
    as,
    vocab,
    staff,
    readit,
} from '../common-rdf/ns';
import ldChannel from '../common-rdf/radio';
import Store from '../common-rdf/store';
import './ontology';
import './nlp-ontology';
import './exploration-data';

const defaultGraphs = [
    rdf(),
    rdfs(),
    owl(),
    'http://www.w3.org/2004/02/skos/core',
    'http://www.w3.org/ns/oa.jsonld',
    'http://dublincore.org/2012/06/14/dcterms.ttl',
    'http://dublincore.org/2012/06/14/dctype.ttl',
    'http://dublincore.org/2012/06/14/dcelements.ttl',
    'http://www.cidoc-crm.org/sites/default/files/cidoc_crm_v6.2.1-2018April.rdfs',
    'http://iflastandards.info/ns/fr/frbr/frbroo.xml',
    'http://erlangen-crm.org/current/',
    // activitystreams appears to consist of only a context.
    // as(),
    // We do not prefetch schema.org, because it is large and we do
    // not use much of it. Individual terms can be imported on demand.
];

const inhouseGraphs = [
    vocab(),
    staff(),
    // readit(), // using the ontology module from now on instead
];

export const globalGraph = new Store();

const prefetchHook = after(defaultGraphs.length, once(prefetch2));

export function prefetch() {
    // For the time being, we skip the attempt to import directly,
    // because most of our defaultGraphs don't support CORS and
    // because it saves a bunch of error messages in the dev console.
    // In the future, we may want to change this back into
    // globalGraph.import(ns).
    defaultGraphs.forEach(ns => globalGraph.importViaProxy(ns));
    // Once the default graphs have arrived, we want to continue prefetching our
    // own materials.
    globalGraph.on('update', prefetchHook);
}

async function prefetch2() {
    globalGraph.off('update', prefetchHook);
    inhouseGraphs.forEach(ns => globalGraph.import(ns));
    const gotOntology = ldChannel.request('ontology:promise');
    const gotNlpOntology = ldChannel.request('nlp-ontology:promise');
    ldChannel.request('sources:tally');
    ldChannel.request('items:tally');
    // We wait for the ontologies to arrive before fetching sources and items,
    // because this potentially prevents double requests if client code starts
    // flattening the Subjects already before the ontologies arrive.
    await Promise.all([gotOntology, gotNlpOntology]);
    ldChannel.request('sources:user');
    ldChannel.request('items:user');
    ldChannel.request('sources:random');
    ldChannel.request('items:random');
}

if (window['DEBUGGING']) {
    window['globalGraph'] = globalGraph;
}
