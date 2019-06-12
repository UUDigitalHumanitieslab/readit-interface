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
    "Dataset":              "dctypes:Dataset",
    "Image":                "dctypes:StillImage",
    "Video":                "dctypes:MovingImage",
    "Audio":                "dctypes:Sound",
    "Text":                 "dctypes:Text",
};

export const contextIRI = 'http://example.org/context.jsonld';

export const composedContext = [
    contextIRI,
    webAnnoExerpt,
];
