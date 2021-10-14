import {
    rdfs,
    owl,
    cidoc,
    readit,
    skos,
    schema,
} from '../common-rdf/ns';

export const readerClass = {
    "@id": cidoc("E21_Person"),
    "@type": [owl.Class],
    [rdfs.label]: [{
        "@language": "en",
        "@value": "E21 Person"
    }],
    [skos.prefLabel]: [{
        "@language": "en",
        "@value": "Reader"
    }],
    [schema.color]: [
        { '@value': '#009E73' }
    ],
};

export const genderClass = {
    "@id": readit("REO5"),
    "@type": [owl.Class],
    [rdfs.label]: [{
        "@language": "en",
        "@value": "REO05 Gender"
    }],
    [skos.prefLabel]: [{
        "@language": "en",
        "@value": "Gender"
    }],
    [schema.color]: [
        { '@value': '#009E73' }
    ],
    [skos.related]: [{
        "@id": cidoc("E21_Person")
    }]
};

export const hasGenderProperty = {
    "@id": readit("readP3"),
    "@type": [owl.ObjectProperty],
    [rdfs.domain]: [{
        "@id": cidoc("E21_Person")
    }],
    [rdfs.range]: [{
        "@id": readit("REO5")
    }],
    [rdfs.label]: [{
        "@language": "en",
        "@value": "readP3 has gender"
    }],
    [skos.prefLabel]: [{
        "@language": "en",
        "@value": "has gender"
    }]
};

export const effectsClass = {
    "@id": readit("REO23"),
    "@type": [owl.Class],
    [rdfs.label]: [{
        "@language": "en",
        "@value": "REO23 Effects (internal processes)"
    }],
    [rdfs.subClassOf]: [{
        "@id": readit("REO42")
    }, {
        "@id": cidoc("E7_Activity")
    }],
    [schema.color]: [
        { '@value': '#CC79A7' }
    ],
    [skos.prefLabel]: [{
        "@language": "en",
        "@value": "Effects (internal processes)"
    }]
};

export const understandingClass = {
    "@id": readit("REO20"),
    "@type": [owl.Class],
    [rdfs.label]: [{
        "@language": "en",
        "@value": "REO20 Understanding"
    }],
    [schema.color]: [
        { '@value': '#CC79A7' }
    ],
    [skos.prefLabel]: [{
        "@language": "en",
        "@value": "Understanding"
    }],
    [skos.related]: [{
        "@id": readit("REO23"),
    }]
};

export default [
    readerClass,
    genderClass,
    hasGenderProperty,
    effectsClass,
    understandingClass,
];
