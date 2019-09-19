import {
    rdf,
    rdfs,
    owl,
    as,
} from '../jsonld/ns';
import Store from '../jsonld/store';

const defaultGraphs = [
    rdf(),
    rdfs(),
    owl(),
    'http://www.w3.org/ns/oa.jsonld',
    'http://dublincore.org/2012/06/14/dcterms.ttl',
    'http://dublincore.org/2012/06/14/dctype.ttl',
    'http://dublincore.org/2012/06/14/dcelements.ttl',
    // activitystreams appears to consist of only a context.
    // as(),
    // Keep schema at the bottom, because it is large and we do not
    // use much of it.
    'https://schema.org/version/latest/schema.jsonld',
];

const globalGraph = new Store();

defaultGraphs.forEach(ns => globalGraph.import(ns));

export default globalGraph;
