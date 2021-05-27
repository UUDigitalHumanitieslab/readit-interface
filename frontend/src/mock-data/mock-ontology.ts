import {
    rdf,
    rdfs,
    owl,
    dcterms,
    staff,
    readit,
    item,
    vocab,
    skos,
    schema,
    xsd,
    oa,
} from '../common-rdf/ns';

export const contentClass = {
    "@id": readit('Content'),
    "@type": [rdfs.Class],
    [rdfs.subClassOf]: [
        { '@id': readit('ReadingResource')}
    ],
    [skos.prefLabel]: [
        { '@value': 'Content' },
    ],
    [skos.definition]: [
        { '@value': 'Dit is de definitie van content' },
    ],
    [dcterms.created]: [
        {
            "@type": xsd.dateTime,
            "@value": "2085-12-31T04:33:16+0100"
        }
    ],
    [dcterms.creator]: [
        {
            "@id": staff('JdeKruif')
        }
    ],
    [schema.color]: [
        { '@value': '#F5CAC3' }
    ],
};

export const readerClass = {
    "@id": readit('Reader'),
    "@type": [rdfs.Class],
    [rdfs.subClassOf]: [
        { '@id': readit('Person')}
    ],
    [skos.prefLabel]: [
        { '@value': 'Reader' },
    ],
    [skos.definition]: [
        { '@value': 'Dit is de definitie van reader' },
    ],
    [dcterms.created]: [
        {
            "@type": xsd.dateTime,
            "@value": "2085-12-31T04:33:16+0100"
        }
    ],
    [dcterms.creator]: [
        {
            "@id": staff('JdeKruif')
        }
    ],
    [schema.color]: [
        { '@value': '#F18F01' }
    ],
};

export const mediumClass = {
    "@id": readit('Medium'),
    "@type": [rdfs.Class],
    [skos.prefLabel]: [
        { '@value': 'Medium' },
    ],
    [skos.definition]: [
        { '@value': 'Dit is de definitie van medium' },
    ],
    [dcterms.created]: [
        {
            "@type": xsd.dateTime,
            "@value": "2085-12-31T04:33:16+0100"
        }
    ],
    [dcterms.creator]: [
        {
            "@id": staff('JdeKruif')
        }
    ],
    [schema.color]: [
        { '@value': '#60D394' }
    ],
};

export const personClass = {
    "@id": readit('Person'),
    "@type": [rdfs.Class],
    [skos.prefLabel]: [
        { '@value': 'Person' },
    ],
    [skos.definition]: [
        { '@value': 'Dit is de definitie van person' },
    ],
    [dcterms.created]: [
        {
            "@type": xsd.dateTime,
            "@value": "2085-12-31T04:33:16+0100"
        }
    ],
    [dcterms.creator]: [
        {
            "@id": staff('JdeKruif')
        }
    ],
    [schema.color]: [
        { '@value': '#c32433' }
    ],
};

export const descriptionOfProperty = {
    '@id': readit('descriptionOf'),
    '@type': [rdf.Property],
    [skos.prefLabel]: [{
        '@value': 'description of',
    }],
    [rdfs.domain]: [{
        '@id': readit('Reader'),
    }],
    [rdfs.range]: [{
        '@id': readit('Person'),
    }],
    [skos.definition]: [
        { '@value': 'Dit is de definitie van descriptionOf' },
    ],
    [dcterms.created]: [
        {
            "@type": xsd.dateTime,
            "@value": "2085-12-31T04:33:16+0100"
        }
    ],
    [dcterms.creator]: [
        {
            "@id": staff('JdeKruif')
        }
    ],
};

export default [
    contentClass,
    mediumClass,
    readerClass,
    personClass,
    descriptionOfProperty,
]
