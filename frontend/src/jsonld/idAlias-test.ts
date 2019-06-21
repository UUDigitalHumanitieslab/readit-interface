import { webAnnoExerpt, contextIRI } from '../mock-data/mock-context';
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
        webAnnoExerpt, // We want the `id` key from this one.
        {
            // Looks like it but isn't.
            "id":      {"@type": "@id", "@id": "oa:via"},
            "type":    {"@type": "@id", "@id": "@type"},
        },
        null,
    ],
};

const faultyContext = {
    '@context': [contextIRI],
};

const greyAreaContext = {
    '@context': [
        contextIRI,
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
