import { vocab, staff, readit, item } from '../jsonld/ns';

// This was extracted from the W3C web annotation context.
export const webAnnoExerpt = {
    "oa":      "http://www.w3.org/ns/oa#",
    "dc":      "http://purl.org/dc/elements/1.1/",
    "dcterms": "http://purl.org/dc/terms/",
    "dctypes": "http://purl.org/dc/dcmitype/",
    "foaf":    "http://xmlns.com/foaf/0.1/",
    "rdf":     "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
    "rdfs":    "http://www.w3.org/2000/01/rdf-schema#",
    "skos":    "http://www.w3.org/2004/02/skos/core#",
    "xsd":     "http://www.w3.org/2001/XMLSchema#",
    "iana":    "http://www.iana.org/assignments/relation/",
    "owl":     "http://www.w3.org/2002/07/owl#",
    "as":      "http://www.w3.org/ns/activitystreams#",
    "schema":  "http://schema.org/",

    "id":      {"@type": "@id", "@id": "@id"},
    "type":    {"@type": "@id", "@id": "@type"},

    "Annotation":           "oa:Annotation",
    "SpecificResource":     "oa:SpecificResource",
    "TextQuoteSelector":    "oa:TextQuoteSelector",

    "identifying":   "oa:identifying",
    "tagging":       "oa:tagging",

    "body":          {"@type": "@id", "@id": "oa:hasBody"},
    "target":        {"@type": "@id", "@id": "oa:hasTarget"},
    "source":        {"@type": "@id", "@id": "oa:hasSource"},
    "selector":      {"@type": "@id", "@id": "oa:hasSelector"},
    "creator":       {"@type": "@id", "@id": "dcterms:creator"},
    "motivation":    {"@type": "@vocab", "@id": "oa:motivatedBy"},

    "exact":         "oa:exact",
    "prefix":        "oa:prefix",
    "suffix":        "oa:suffix",

    "created":       {"@id": "dcterms:created", "@type": "xsd:dateTime"},

    "start":         {"@id": "oa:start", "@type": "xsd:nonNegativeInteger"},
    "end":           {"@id": "oa:end", "@type": "xsd:nonNegativeInteger"},
};

// This builds on top of the webAnnoExerpt above.
export const readitContext = {
    '@base': item(),
    vocab: vocab(),
    staff: staff(),
    readit: readit(),

    sameAs:          {'@id': 'owl:sameAs', '@type': '@id'},
    prefLabel:       'skos:prefLabel',
    definition:      'skos:definition',
    title:           'dcterms:title',
    color:           'schema:color',
};

export default [webAnnoExerpt, readitContext];

export const contextIRI = 'http://example.org/context.jsonld';

export const composedContext = [
    contextIRI,
    webAnnoExerpt,
];
