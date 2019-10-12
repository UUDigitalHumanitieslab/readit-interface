

import Node  from './../../jsonld/node';
import { oa, item, source, vocab, rdf, xsd, staff, dcterms, skos } from './../../jsonld/ns';
import Graph from '../../jsonld/graph';

const prefixLength = 100;
const suffixLength = 100;
const localStorageKey = "lskLatestNodeId";

/**
 *
 */
export function createBody(ontologyItem: Node, annotationText: string): Node[] {
    return [
        ontologyItem,
        new Node({
            '@id': getNewId(),
            '@type': ontologyItem.id,
            [skos.prefLabel]: getItemLabel(annotationText),
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
        })
    ]
}

function getItemLabel(annotationText: string): string {
    if (annotationText.length < 80) return annotationText;
    return `${annotationText.substring(0, 75)} (...)`;
}

/**
 * Create all items required to correctly save an annotation.
 * Returns a array of nodes with the following:
 *  - oa:Annotation,
 *  - oa:SpecificResource,
 *  - vocab('RangeSelector'),
 *  - 2 oa.XPathSelectors (start and end)
 *  - oa: TextQuoteSelector
 *
 * Please note that the View that selectable text is in should be in the DOM.
 * If it is not, the TextQuoteSelector will not be present in the result.
 * @param range
 */
export function createAnnotation(range: Range): Node {

    let startSelector = getStartSelector(range);
    let endSelector = getEndSelector(range);
    let rangeSelector = getRangeSelector(startSelector.id, endSelector.id);
    let textQuoteSelector = getTextQuoteSelector(range);
    let specificResource = getSpecificResource(rangeSelector.id, textQuoteSelector.id);
    let anno = getAnnotation(specificResource.id);

    anno.collection = new Graph([
        specificResource,
        rangeSelector,
        startSelector,
        endSelector,
        textQuoteSelector
    ]);

    return anno;
}

function getNewId(): string {
    // localStorage.clear();
    let latestIdString = localStorage.getItem(localStorageKey) || "1000";
    let latestId = parseInt(latestIdString);
    let newId = (latestId + 1).toString();
    localStorage.setItem(localStorageKey, newId);
    return newId;
}

function getAnnotation(specResId: string): Node {
    return new Node({
        "@id": item(getNewId()),
    "@type": [oa.Annotation],
    [oa.hasTarget]: [
        {
            "@id": specResId
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
    });
}

function getSpecificResource(rangeSelId: string, textQuoteSelectorId: string): Node {
    return new Node({
        '@id': item(getNewId()),
        '@type': [oa.SpecificResource],
        [oa.hasSelector]: [
            {
                '@id': rangeSelId
            },
            {
                '@id': textQuoteSelectorId
            }
        ],
        [oa.hasSource]: [
            {
                "@id": source('1')
            }
        ]
    });
}

function getRangeSelector(startSelId: string, endSelId: string): Node {
    return new Node({
        '@id': item(getNewId()),
        '@type': [vocab('RangeSelector')],
        [oa.hasStartSelector]: [
            {
                "@id": startSelId
            }
        ],
        [oa.hasEndSelector]: [
            {
                "@id": endSelId
            }
        ],
    });
}

function getStartSelector(range: Range): Node {
    return new Node({
        '@id': item(getNewId()),
        '@type': [oa.XPathSelector],
        [rdf.value]: [
            {
                '@value': `substring(.//*[${getStartNodeIndex(range)}]/text(), ${range.startOffset})`
            }
        ],
    });
}

function getEndSelector(range: Range): Node {
    return new Node({
        '@id': item(getNewId()),
        '@type': [oa.XPathSelector],
        [rdf.value]: [
            {
                '@value': `substring(.//*[${getEndNodeIndex(range)}]/text(), ${range.endOffset})`
            }
        ],
    });
}

function getStartNodeIndex(range: Range): number {
    return getNodeIndex(range.startContainer.parentElement, range.startContainer);
}

function getEndNodeIndex(range: Range): number {
    return getNodeIndex(range.endContainer.parentElement, range.endContainer);
}

function getNodeIndex(parent, child): number {
    // TODO: do this in a nicer way!!
    let children = $(parent).contents();

    let index = 0;

    for (let c of <any>children) {
        if (c === child) {
            break;
        }

        index++;
    }

    return index;
}

function getTextQuoteSelector(range: Range): Node {
    return new Node({
        '@id': item(getNewId()),
        '@type': [oa.TextQuoteSelector],
        [oa.prefix]: [
            {
                '@value': getPrefix(range)
            }
        ],
        [oa.exact]: [
            {
                "@value": range.toString()
            }
        ],
        [oa.suffix]: [
            {
                "@value": getSuffix(range)
            }
        ],
    });
}

function getPrefix(exactRange: Range): string {
    let startCharacterIndex = exactRange.startOffset - prefixLength;
    if (startCharacterIndex < 0) startCharacterIndex = 0;
    let prefixRange = document.createRange();
    prefixRange.setStart(exactRange.startContainer, startCharacterIndex);
    prefixRange.setEnd(exactRange.startContainer, exactRange.startOffset);
    let result = prefixRange.toString();
    prefixRange.detach();
    return result;
}

function getSuffix(exactRange: Range): string {
    let endCharacterIndex = exactRange.endOffset + suffixLength;
    if (endCharacterIndex > exactRange.endContainer.textContent.length) {
        endCharacterIndex = exactRange.endContainer.textContent.length;
    }
    let suffixRange = document.createRange();
    suffixRange.setStart(exactRange.endContainer, exactRange.endOffset);
    suffixRange.setEnd(exactRange.endContainer, endCharacterIndex);
    let result = suffixRange.toString();
    suffixRange.detach();
    return result;
}
