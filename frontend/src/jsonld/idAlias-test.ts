import { ResolvedContext } from './json';
import computeIdAlias from './idAlias';

const noOverrides = [
    null,
    {},
    {'@context': []},
    [{irrelevant: 'irrelevant'}],
];

const simpleContext = {
    altId: '@id',
};

const elaborateContext = {
    '@context': [
        null,
        {
            // This one shouldn't turn up as the result.
            unicorn: '@id',
        },
        {
            // Neither should this one.
            rainbow: {"@type": "@id", "@id": "@id"},
        },
        { // This is an exerpt from the W3C web annotation context.
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

            // We want this one.
            "id":      {"@type": "@id", "@id": "@id"},
            "type":    {"@type": "@id", "@id": "@type"},

            "Annotation":           "oa:Annotation",
            "Dataset":              "dctypes:Dataset",
            "Image":                "dctypes:StillImage",
            "Video":                "dctypes:MovingImage",
            "Audio":                "dctypes:Sound",
            "Text":                 "dctypes:Text",
        },
        {
            // Looks like it but isn't.
            "id":      {"@type": "@id", "@id": "oa:via"},
            "type":    {"@type": "@id", "@id": "@type"},
        },
        null,
    ],
};

const faultyContext = {
    '@context': ['http://example.org/context.jsonld'],
};

const greyAreaContext = {
    '@context': [
        'http://example.org/context.jsonld',
        {
            // Presence of this one should prevent the previous
            // external context from being processed.
            altId: '@id',
        },
    ],
};

function expectAlias(context, alias) {
    expect(computeIdAlias(context)).toBe(alias);
}

function buggy() {
    return computeIdAlias(faultyContext as unknown as ResolvedContext);
}

describe('computeIdAlias', function() {
    it('returns undefined if the context does not alias @id', function() {
        noOverrides.forEach(context => expectAlias(context, undefined));
    });

    it('returns the alias if it does', function() {
        expectAlias(simpleContext, 'altId');
    });

    it('can handle elaborate cases', function() {
        expectAlias(elaborateContext, 'id');
    });

    it('throws if the context is external', function() {
        expect(buggy).toThrowError(TypeError);
    });

    it('can ignore irrelevant external contexts', function() {
        expectAlias(greyAreaContext, 'altId');
    });
});
