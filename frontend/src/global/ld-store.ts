import {
    rdf,
    rdfs,
    owl,
    oa,
    as,
    schema,
    dc,
    dcterms,
    dctypes,
} from '../jsonld/ns';
import Store from '../jsonld/store';

const defaultGraphs = [
    rdf(),
    rdfs(),
    owl(),
    oa(),
    // activitystreams appears to consist of only a context.
    as(),
    // Keep schema at the bottom, because it is large and we do not
    // use much of it.
    'https://schema.org/version/latest/schema.jsonld',
];

const globalGraph = new Store();

defaultGraphs.forEach(ns => globalGraph.import(ns));

export default globalGraph;
