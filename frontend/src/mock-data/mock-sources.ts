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
import mockSourceText from './mock-source-text';

export const source1instance = {
    "@id": source('1'),
    "@type": vocab('Source'),
    [schema.headline]: [
        {
            "@value": "Title of this source"
        }
    ],
    [schema.alternativeHeadline]: [
        {
            "@value": "Subtitle of the source"
        }
    ],
    [schema.text]: [
        {
            "@value": mockSourceText
        },
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
    // More metadata
}
