import {
    dcterms,
    staff,
    source,
    vocab,
    schema,
    sourceOntology,
    xsd,
    iso6391,
} from '../common-rdf/ns';
import mockSourceText from './mock-source-text';

export const source1instance = {
    "@id": source('1'),
    "@type": vocab('Source'),
    [schema('name')]: [
        {
            "@type": xsd.string,
            "@value": "Corpus_50_exp_lectures_interligne1.5 (1).pdf"
        }
    ],
    [sourceOntology('author')]: [
        {
            "@type": xsd.string,
            "@value": "Tess T. Author"
        }
    ],
    // TODO: move text to a file and link to it (in an appropriate property!)
    [sourceOntology('fullText')]: [
        {
            "@value": mockSourceText
        },
    ],
    [sourceOntology('datePublished')]: [
        {
            "@type": xsd.dateTime,
            "@value": "1900-01-01T00:00:00+0100"
        }
    ],
    [sourceOntology('language')]: [
        {
            "@id": iso6391.en
        },
    ],
    [sourceOntology('dateUploaded')]: [
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
    // More metadata, for instance: schema.partOf, schema.publisher, schema.translator, schema.version, schema.copyrightHolder, schema.keywords
}

export default [
    source1instance,
]
