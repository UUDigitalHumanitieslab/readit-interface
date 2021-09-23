import {
    rdf,
    rdfs,
    owl,
    as,
    vocab,
    staff,
    readit,
} from '../common-rdf/ns';
import ldChannel from '../common-rdf/radio';
import Store from '../common-rdf/store';
import './ontology';

const defaultGraphs = [
    rdf(),
    rdfs(),
    owl(),
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

export function prefetch() {
    inhouseGraphs.forEach(ns => globalGraph.import(ns));
    ldChannel.trigger('cache:ontology');
    ldChannel.trigger('cache:nlp-ontology');
    // ldChannel.trigger('cache:item-list');
    // ldChannel.trigger('cache:source-list');
    // For the time being, we skip the attempt to import directly,
    // because most of our defaultGraphs don't support CORS and
    // because it saves a bunch of error messages in the dev console.
    // In the future, we may want to change this back into
    // globalGraph.import(ns).
    defaultGraphs.forEach(ns => globalGraph.importViaProxy(ns));
}

if (window['DEBUGGING']) {
    window['globalGraph'] = globalGraph;
}
