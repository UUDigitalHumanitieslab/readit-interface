import {
    rdfs,
    owl,
    dcterms,
    staff,
    readit,
    item,
    skos,
    schema,
    xsd,
    oa,
} from '../common-rdf/ns';

export const contentInstance = {
    '@id': item('3'),
    "@type": [readit('Content')],
    [owl.sameAs]: [
        { '@id': "http://www.wikidata.org/entity/Q331656" }
    ],
    [dcterms.creator]: [
        { '@id': staff('JdeKruif') },
    ],
    [dcterms.created]: [
        {
            "@type": xsd.dateTime,
            '@value': "2085-12-31T03:33:16.000Z"
        }
    ],
    [dcterms.title]: [
        { '@value': 'Pretty Little Title' }
    ],
};

export const contentClass = {
    "@id": readit('Content'),
    "@type": [rdfs.Class],
    [skos.prefLabel]: [
        { '@value': 'Content' },
    ],
    [skos.definition]: [
        { '@value': 'Dit is de definitie van content' },
    ],
    [dcterms.created]: [
        {
            "@type": xsd.dateTime,
            "@value": "2085-12-31T03:33:16.000Z"
        }
    ],
    [dcterms.creator]: [
        {
            "@id": staff('JdeKruif')
        }
    ],
    [schema.color]: [
        { '@value': 'hotpink' }
    ],
};

export const specificResource = {
    "@id": item('2'),
    "@type": [oa.SpecificResource],
    [dcterms.created]: [
        {
            "@type": xsd.dateTime,
            "@value": "2085-12-31T03:33:15.000Z"
        }
    ],
    [dcterms.creator]: [
        {
            "@id": staff('JdeKruif')
        }
    ],
    [oa.hasSelector]: [
        {
            "@id": item('5')
        }
    ],
    [oa.hasSource]: [
        {
            "@id": "https://drive.google.com/drive/folders/1jJWerBVv5AMjI0SLjSDwHXH0QV9iVZpf"
        }
    ]
};

export const textQuoteSelector = {
    "@id": item('4'),
    "@type": [oa.TextQuoteSelector],
    [dcterms.created]: [
        {
            "@type": xsd.dateTime,
            "@value": "2085-12-31T03:33:15.000Z"
        }
    ],
    [dcterms.creator]: [
        {
            "@id": staff('JdeKruif')
        }
    ],
    [oa.exact]: [
        {
            "@value": "The Voyage of the Dawn Treader"
        }
    ],
    [oa.prefix]: [
        {
            "@value": "feel, ooh, there are more things to explore, and I think one found that throughout the whole of that sequence, "
        }
    ],
    [oa.suffix]: [
        {
            "@value": ", to discover that John Mandeville had written that this was the, the, later, to discover that these were stories that people in the Middle Ages, he was playing around with stories that already existed."
        }
    ]
};

export const textPositionSelector = {
    "@id": item('5'),
    "@type": [oa.TextQuoteSelector],
    [dcterms.created]: [
        {
            "@type": xsd.dateTime,
            "@value": "2085-12-31T03:33:15.000Z"
        }
    ],
    [dcterms.creator]: [
        {
            "@id": staff('JdeKruif')
        }
    ],
    [oa.start]: [
        {
            "@value": 932,
            "@type": xsd.nonNegativeInteger
        }
    ],
    [oa.end]: [
        {
            "@value": 962,
            "@type": xsd.nonNegativeInteger
        }
    ]
};

export const annotationInstance = {
    "@id": item('1'),
    "@type": [oa.Annotation],
    [oa.hasBody]: [
        {
            "@id": readit('Content')
        },
        {
            "@id": item('3')
        }
    ],
    [dcterms.created]: [
        {
            "@type": xsd.dateTime,
            "@value": "2085-12-31T03:33:16.000Z"
        }
    ],
    [dcterms.creator]: [
        {
            "@id": staff('JdeKruif')
        }
    ],
    [oa.motivatedBy]: [
        {
            "@id": oa.tagging
        },
        {
            "@id": oa.identifying
        }
    ],
    [oa.hasTarget]: [
        {
            "@id": item('2')
        }
    ]
};

export default [
    contentClass,
    contentInstance,
    specificResource,
    textQuoteSelector,
    textPositionSelector,
    annotationInstance,
];
