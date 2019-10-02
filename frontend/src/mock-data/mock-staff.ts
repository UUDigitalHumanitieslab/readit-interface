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

export const JoseInstance = {
    "@id": staff('JdeKruif'),
    "@type": [schema.Person],
    [schema.name]: [
        {
            "@value": "José de Kruif"
        }
    ],
    [schema.affiliation]: [
        {
            "@id": staff('UU')
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
            "@id": staff('AHebing')
        }
    ],
};

export const AlexInstance = {
    "@id": staff('AHebing'),
    "@type": [schema.Person],
    [schema.name]: [
        {
            "@value": "Alex Hebing"
        }
    ],
    [schema.affiliation]: [
        {
            "@id": staff('UU')
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
            "@id": staff('AHebing')
        }
    ],
};

export const uuInstance = {
    "@id": staff('UU'),
    "@type": [schema.Organization],
    [schema.name]: [
        {
            "@value": "Utrecht University"
        }
    ],
    [schema.location]: [
        {
            "@value": "Utrecht"
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
            "@id": staff('AHebing')
        }
    ],
}

export default [
    JoseInstance,
    AlexInstance,
    uuInstance
]
