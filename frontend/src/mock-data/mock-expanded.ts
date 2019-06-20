export const contentInstance = {
    '@id': 'uniqueID',
    'http://www.w3.org/2004/02/skos/core#prefLabel': [
        { '@value': 'Content' },
    ],
    "@type": [
        { '@id': "rdfs:Class" }
    ],
    "http://www.w3.org/2002/07/owl#sameAs": [
        { '@id': "http://www.wikidata.org/entity/Q331656" }
    ],
    "creator": [
        { '@id': "staff:JdeKruif" },
    ],
    "created": [
        { '@value': "2085-12-31T04:33:16+0100" }
    ],
    "readit:Title": [
        { '@value': 'Pretty Little Title' }
    ],
    'http://www.w3.org/2004/02/skos/core#definition': [
        { '@value': 'Dit is de definitie van content' },
    ],
    'http://schema.org/color': [
        { '@value': 'hotpink'}
    ],
};

export const contentClass = {
    "@id": "https://read-it.hum.uu.nl/item/3",
    "@type": [
        { '@id': "rdfs:Class" }
    ],
    'http://www.w3.org/2004/02/skos/core#prefLabel': [
        { '@value': 'Content' },
    ],
    'http://www.w3.org/2004/02/skos/core#definition': [
        { '@value': 'Dit is de definitie van content' },
    ],
    "http://purl.org/dc/terms/created": [
        {
            "@type": "http://www.w3.org/2001/XMLSchema#dateTime",
            "@value": "2085-12-31T04:33:16+0100"
        }
    ],
    "http://purl.org/dc/terms/creator": [
        {
            "@id": "https://read-it.hum.uu.nl/staff/JdeKruif"
        }
    ],
    "http://www.w3.org/2002/07/owl#sameAs": [
        {
            "@id": "http://www.wikidata.org/entity/Q331656"
        }
    ],
    'http://schema.org/color': [
        { '@value': 'hotpink' }
    ],
};

export const specificResource = {
    "@id": "https://read-it.hum.uu.nl/item/2",
    "@type": [
        { "@id": "http://www.w3.org/ns/oa#SpecificResource" },
    ],
    "http://purl.org/dc/terms/created": [
        {
            "@type": "http://www.w3.org/2001/XMLSchema#dateTime",
            "@value": "2085-12-31T04:33:15+0100"
        }
    ],
    "http://purl.org/dc/terms/creator": [
        {
            "@id": "https://read-it.hum.uu.nl/staff/JdeKruif"
        }
    ],
    "http://www.w3.org/ns/oa#hasSelector": [
        {
            "@id": "https://read-it.hum.uu.nl/item/5"
        }
    ],
    "http://www.w3.org/ns/oa#hasSource": [
        {
            "@id": "https://drive.google.com/drive/folders/1jJWerBVv5AMjI0SLjSDwHXH0QV9iVZpf"
        }
    ]
};

export const textQuoteSelector = {
    "@id": "https://read-it.hum.uu.nl/item/4",
    "@type": [
        { '@id': "http://www.w3.org/ns/oa#TextQuoteSelector" }
    ],
    "http://purl.org/dc/terms/created": [
        {
            "@type": "http://www.w3.org/2001/XMLSchema#dateTime",
            "@value": "2085-12-31T04:33:15+0100"
        }
    ],
    "http://purl.org/dc/terms/creator": [
        {
            "@id": "https://read-it.hum.uu.nl/staff/JdeKruif"
        }
    ],
    "http://www.w3.org/ns/oa#exact": [
        {
            "@value": "The Voyage of the Dawn Treader"
        }
    ],
    "http://www.w3.org/ns/oa#prefix": [
        {
            "@value": "feel, ooh, there are more things to explore, and I think one found that throughout the whole of that sequence, "
        }
    ],
    "http://www.w3.org/ns/oa#suffix": [
        {
            "@value": ", to discover that John Mandeville had written that this was the, the, later, to discover that these were stories that people in the Middle Ages, he was playing around with stories that already existed."
        }
    ]
};

export const textPositionSelector = {
    "@id": "https://read-it.hum.uu.nl/item/5",
    "@type": [
        { '@id': "http://www.w3.org/ns/oa#TextQuoteSelector" }
    ],
    "http://purl.org/dc/terms/created": [
        {
            "@type": "http://www.w3.org/2001/XMLSchema#dateTime",
            "@value": "2085-12-31T04:33:15+0100"
        }
    ],
    "http://purl.org/dc/terms/creator": [
        {
            "@id": "https://read-it.hum.uu.nl/staff/JdeKruif"
        }
    ],
    "http://www.w3.org/ns/oa#start": [
        {
            "@value": 932
        }
    ],
    "http://www.w3.org/ns/oa#end": [
        {
            "@value": 962
        }
    ]
};

export const annotationInstance = {
    "@id": "https://read-it.hum.uu.nl/item/1",
    "@type": [
        { '@id': "http://www.w3.org/ns/oa#Annotation" }
    ],
    "http://www.w3.org/ns/oa#hasBody": [
        {
            "@id": "https://read-it.hum.uu.nl/ontology/Content"
        },
        {
            "@id": "https://read-it.hum.uu.nl/item/3"
        }
    ],
    "http://purl.org/dc/terms/created": [
        {
            "@type": "http://www.w3.org/2001/XMLSchema#dateTime",
            "@value": "2085-12-31T04:33:16+0100"
        }
    ],
    "http://purl.org/dc/terms/creator": [
        {
            "@id": "https://read-it.hum.uu.nl/staff/JdeKruif"
        }
    ],
    "http://www.w3.org/ns/oa#motivatedBy": [
        {
            "@id": "http://www.w3.org/ns/oa#tagging"
        },
        {
            "@id": "http://www.w3.org/ns/oa#identifying"
        }
    ],
    "http://www.w3.org/ns/oa#hasTarget": [
        {
            "@id": "https://read-it.hum.uu.nl/item/2"
        }
    ]
};

export default [
    contentClass,
    specificResource,
    textPositionSelector,
    annotationInstance,
];
