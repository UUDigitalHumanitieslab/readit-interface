import {
    rdf,
    rdfs,
    owl,
    dcterms,
    staff,
    readit,
    item,
    source,
    vocab,
    skos,
    schema,
    xsd,
    oa,
} from '../jsonld/ns';

/**
 * 5 example annotations, 3 overlapping, all in source1
 */

// annotation 1. Note that it only points to a Body and a Target
export const anno1Instance = {
    "@id": item('100'),
    "@type": [oa.Annotation],
    [oa.hasBody]: [
        {
            "@id": readit('Content')
        },
        {
            "@id": item('200')
        }
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
            "@id": item('300')
        }
    ]
};

// the body of anno1
export const anno1ContentInstance = {
    '@id': item('200'),
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
            '@value': "2085-12-31T04:33:16+0100"
        }
    ],
    [skos.prefLabel]: [
        { '@value': 'The Idler in France' },
    ],
};

// the target of anno1
export const anno1SpecificResource = {
    "@id": item('300'),
    "@type": [oa.SpecificResource],
    [dcterms.created]: [
        {
            "@type": xsd.dateTime,
            "@value": "2085-12-31T04:33:15+0100"
        }
    ],
    [dcterms.creator]: [
        {
            "@id": staff('JdeKruif')
        }
    ],
    [oa.hasSelector]: [
        {
            "@id": item('400')
        },
        {
            "@id": item('700')
        }
    ],
    [oa.hasSource]: [
        {
            "@id": source('1')
        }
    ]
};

// the (Range)Selector belonging (via item('300') / specificResource) to anno1
export const anno1PositionSelector = {
    "@id": item('400'),
    "@type": [oa.TextPositionSelector],
    [oa.start]: [
        {
            "@value": 15
        }
    ],
    [oa.end]: [
        {
            "@value": 34
        }
    ],
    [dcterms.created]: [
        {
            "@type": xsd.dateTime,
            "@value": "2085-12-31T04:33:15+0100"
        }
    ],
    [dcterms.creator]: [
        {
            "@id": staff('JdeKruif')
        }
    ],
}

//a TextQuoteSelector belong to anno 1
export const anno1TextQuoteSelector = {
    "@id": item('700'),
    "@type": [oa.TextQuoteSelector],
    [oa.prefix]: [
        {
            '@value': `English descriptions of reading experiences <br><br> id_19 Titre : `
        }
    ],
    [oa.exact]: [
        {
            "@value": `The Idler in France`
        }
    ],
    [oa.suffix]: [
        {
            "@value": ` / by the countess of Blessington Auteur : Blessington,`
        }
    ],
}




// annotation 2.
export const anno2Instance = {
    "@id": item('101'),
    "@type": [oa.Annotation],
    [oa.hasBody]: [
        {
            "@id": readit('Reader')
        },
        {
            "@id": item('201')
        }
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
            "@id": item('301')
        }
    ]
};

export const anno2ReaderInstance = {
    '@id': item('201'),
    "@type": [readit('Reader')],
    [owl.sameAs]: [
        { '@id': "http://www.wikidata.org/entity/Q331656" }
    ],
    [dcterms.creator]: [
        { '@id': staff('JdeKruif') },
    ],
    [dcterms.created]: [
        {
            "@type": xsd.dateTime,
            '@value': "2085-12-31T04:33:16+0100"
        }
    ],
    [skos.prefLabel]: [
        { '@value': 'Blessington, Margaret' },
    ],
};

export const anno2SpecificResource = {
    "@id": item('301'),
    "@type": [oa.SpecificResource],
    [dcterms.created]: [
        {
            "@type": xsd.dateTime,
            "@value": "2085-12-31T04:33:15+0100"
        }
    ],
    [dcterms.creator]: [
        {
            "@id": staff('JdeKruif')
        }
    ],
    [oa.hasSelector]: [
        {
            "@id": item('401')
        },
        {
            "@id": item('701')
        }
    ],
    [oa.hasSource]: [
        {
            "@id": source('1')
        }
    ]
};

export const anno2PositionSelector = {
    "@id": item('401'),
    "@type": [oa.TextPositionSelector],
    [oa.start]: [
        {
            "@value": 77
        }
    ],
    [oa.end]: [
        {
            "@value": 98
        }
    ],
    [dcterms.created]: [
        {
            "@type": xsd.dateTime,
            "@value": "2085-12-31T04:33:15+0100"
        }
    ],
    [dcterms.creator]: [
        {
            "@id": staff('JdeKruif')
        }
    ],
}

export const anno2TextQuoteSelector = {
    "@id": item('701'),
    "@type": [oa.TextQuoteSelector],
    [oa.prefix]: [
        {
            '@value': `by the countess of Blessington Auteur: `
        }
    ],
    [oa.exact]: [
        {
            "@value": `Blessington, Margaret`
        }
    ],
    [oa.suffix]: [
        {
            "@value": ` Gardiner. Date d'édition : 1841. Droits`
        }
    ],
}

// annotation 3.
export const anno3Instance = {
    "@id": item('102'),
    "@type": [oa.Annotation],
    [oa.hasBody]: [
        {
            "@id": readit('Reader')
        },
        {
            "@id": item('202')
        }
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
            "@id": item('302')
        }
    ]
};

export const anno3ReaderInstance = {
    '@id': item('202'),
    "@type": [readit('Reader')],
    [dcterms.creator]: [
        { '@id': staff('JdeKruif') },
    ],
    [dcterms.created]: [
        {
            "@type": xsd.dateTime,
            '@value': "2085-12-31T04:33:16+0100"
        }
    ],
    [readit('descriptionOf')]: [
        {
            "@id": item('600')
        },
        {
            "@id": item('601')
        }
    ],
    [readit('reading')]: [
        {
            "@id": item('200')
        }
    ],
    [readit('age')]: [
        {
            "@value": 12
        }
    ],
    [skos.prefLabel]: [
        { '@value': 'Blessington, Margaret Gardiner' },
    ],
};

export const BlessingtonPersonInstance = {
    '@id': item('600'),
    "@type": [readit('Person')],
    [dcterms.creator]: [
        { '@id': staff('JdeKruif') },
    ],
    [dcterms.created]: [
        {
            "@type": xsd.dateTime,
            '@value': "2085-12-31T04:33:16+0100"
        }
    ],
    [readit('name')]: [
        {
            "@value": "Margaret Gardiner Blessington"
        }
    ],
    [schema.birthPlace]: [
        {
            "@value": "London"
        }
    ],
}

export const anno3Person2Instance = {
    '@id': item('601'),
    "@type": [readit('Person')],
    [dcterms.creator]: [
        { '@id': staff('JdeKruif') },
    ],
    [dcterms.created]: [
        {
            "@type": xsd.dateTime,
            '@value': "2085-12-31T04:33:16+0100"
        }
    ],
    [readit('name')]: [
        {
            "@value": "Robert Pattison"
        }
    ],
    [schema.birthPlace]: [
        {
            "@value": "London"
        }
    ],
}

export const anno3SpecificResource = {
    "@id": item('302'),
    "@type": [oa.SpecificResource],
    [dcterms.created]: [
        {
            "@type": xsd.dateTime,
            "@value": "2085-12-31T04:33:15+0100"
        }
    ],
    [dcterms.creator]: [
        {
            "@id": staff('JdeKruif')
        }
    ],
    [oa.hasSelector]: [
        {
            "@id": item('402')
        },
        {
            "@id": item('702')
        }
    ],
    [oa.hasSource]: [
        {
            "@id": source('1')
        }
    ]
};

export const anno3PositionSelector = {
    "@id": item('402'),
    "@type": [oa.TextPositionSelector],
    [oa.start]: [
        {
            "@value": 77
        }
    ],
    [oa.end]: [
        {
            "@value": 107
        }
    ],
    [dcterms.created]: [
        {
            "@type": xsd.dateTime,
            "@value": "2085-12-31T04:33:15+0100"
        }
    ],
    [dcterms.creator]: [
        {
            "@id": staff('JdeKruif')
        }
    ],
}

export const anno3TextQuoteSelector = {
    "@id": item('702'),
    "@type": [oa.TextQuoteSelector],
    [oa.prefix]: [
        {
            '@value': `by the countess of Blessington Auteur: `
        }
    ],
    [oa.exact]: [
        {
            "@value": `Blessington, Margaret Gardiner`
        }
    ],
    [oa.suffix]: [
        {
            "@value": `. Date d'édition : 1841. Droits : do- maine`
        }
    ],
}

export const anno4Instance = {
    "@id": item('103'),
    "@type": [oa.Annotation],
    [oa.hasBody]: [
        {
            "@id": readit('Reader')
        },
        {
            "@id": item('203')
        }
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
            "@id": item('303')
        }
    ]
};

export const anno4ReaderInstance = {
    '@id': item('203'),
    "@type": [readit('Reader')],
    [owl.sameAs]: [
        { '@id': "http://www.wikidata.org/entity/Q331656" }
    ],
    [dcterms.creator]: [
        { '@id': staff('JdeKruif') },
    ],
    [readit('descriptionOf')]: [
        {
            "@id": item('600')
        },
    ],
    [dcterms.created]: [
        {
            "@type": xsd.dateTime,
            '@value': "2085-12-31T04:33:16+0100"
        }
    ],
    [dcterms.title]: [
        { '@value': 'I' }
    ],
};

export const anno4SpecificResource = {
    "@id": item('303'),
    "@type": [oa.SpecificResource],
    [dcterms.created]: [
        {
            "@type": xsd.dateTime,
            "@value": "2085-12-31T04:33:15+0100"
        }
    ],
    [dcterms.creator]: [
        {
            "@id": staff('JdeKruif')
        }
    ],
    [oa.hasSelector]: [
        {
            "@id": item('403')
        },
        {
            "@id": item('703')
        }
    ],
    [oa.hasSource]: [
        {
            "@id": item('1')
        }
    ]
};

export const anno4PositionSelector = {
    "@id": item('403'),
    "@type": [oa.TextPositionSelector],
    [oa.start]: [
        {
            "@value": 15
        }
    ],
    [oa.end]: [
        {
            "@value": 16
        }
    ],
    [dcterms.created]: [
        {
            "@type": xsd.dateTime,
            "@value": "2085-12-31T04:33:15+0100"
        }
    ],
    [dcterms.creator]: [
        {
            "@id": staff('JdeKruif')
        }
    ],
}

export const anno4TextQuoteSelector = {
    "@id": item('703'),
    "@type": [oa.TextQuoteSelector],
    [oa.prefix]: [
        {
            '@value': `nationale de France. id_19_a, p 40 `
        }
    ],
    [oa.exact]: [
        {
            "@value": `I`
        }
    ],
    [oa.suffix]: [
        {
            "@value": ` remember reading years ago of the melancholy physiognomy`
        }
    ],
}

// annotation 5.
export const anno5Instance = {
    "@id": item('104'),
    "@type": [oa.Annotation],
    [oa.hasBody]: [
        {
            "@id": readit('Medium')
        },
        {
            "@id": item('204')
        }
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
            "@id": item('304')
        }
    ]
};

export const anno5MediumInstance = {
    '@id': item('204'),
    "@type": [readit('Medium')],
    [owl.sameAs]: [
        { '@id': "http://www.wikidata.org/entity/Q331656" }
    ],
    [dcterms.creator]: [
        { '@id': staff('JdeKruif') },
    ],
    [dcterms.created]: [
        {
            "@type": xsd.dateTime,
            '@value': "2085-12-31T04:33:16+0100"
        }
    ],
    [dcterms.title]: [
        { '@value': `the face of the Duchesse d'Angoulême` }
    ],
};

export const anno5SpecificResource = {
    "@id": item('304'),
    "@type": [oa.SpecificResource],
    [dcterms.created]: [
        {
            "@type": xsd.dateTime,
            "@value": "2085-12-31T04:33:15+0100"
        }
    ],
    [dcterms.creator]: [
        {
            "@id": staff('JdeKruif')
        }
    ],
    [oa.hasSelector]: [
        {
            "@id": item('404')
        },
        {
            "@id": item('704')
        }
    ],
    [oa.hasSource]: [
        {
            "@id": item('1')
        }
    ]
};

export const anno5PositionSelector = {
    "@id": item('404'),
    "@type": [oa.TextPositionSelector],
    [oa.start]: [
        {
            "@value": 355
        }
    ],
    [oa.end]: [
        {
            "@value": 391
        }
    ],
    [dcterms.created]: [
        {
            "@type": xsd.dateTime,
            "@value": "2085-12-31T04:33:15+0100"
        }
    ],
    [dcterms.creator]: [
        {
            "@id": staff('JdeKruif')
        }
    ],
}

export const anno5TextQuoteSelector = {
    "@id": item('704'),
    "@type": [oa.TextQuoteSelector],
    [oa.prefix]: [
        {
            '@value': `was reminded of this anecdote by `
        }
    ],
    [oa.exact]: [
        {
            "@value": `the face of the Duchesse d'Angoulême`
        }
    ],
    [oa.suffix]: [
        {
            "@value": `;for though I do not pretend to`
        }
    ],
}



export default [
    anno1Instance,
    anno1ContentInstance,
    anno1SpecificResource,
    anno1PositionSelector,
    anno1TextQuoteSelector,
    anno2Instance,
    anno2ReaderInstance,
    anno2SpecificResource,
    anno2PositionSelector,
    anno2TextQuoteSelector,
    anno3Instance,
    anno3ReaderInstance,
    anno3Person2Instance,
    anno3SpecificResource,
    anno3PositionSelector,
    anno3TextQuoteSelector,
    BlessingtonPersonInstance,
    anno4Instance,
    anno4ReaderInstance,
    anno4SpecificResource,
    anno4PositionSelector,
    anno4TextQuoteSelector,
    anno5Instance,
    anno5MediumInstance,
    anno5SpecificResource,
    anno5PositionSelector,
    anno5TextQuoteSelector
];
