import FlatItem from '../common-adapters/flat-item-model';
import Subject from '../common-rdf/subject';
import { rdfs, skos, schema, readit } from '../common-rdf/ns';

export type AnnotationPositionDetails = {
    startIndex: number;
    endIndex: number;
}

/**
 * A class that is **not** in the ontology, but which can be used as a
 * placeholder in new annotations and which can be rendered with a color.
 */
export const placeholderClass = new Subject({
    '@id': readit('placeholder'),
    '@type': [rdfs.Class],
    [skos.prefLabel]: 'Selection',
    [skos.definition]: 'This annotation has not been tagged yet.',
    [schema.color]: '#accef7',
});

export const placeholderClassItem = new FlatItem(
    placeholderClass
);

/**
 * Get a text that is usable as a label for an oa:Annotation,
 * from its highlight text.
 */
export function getLabelText(text: string): string {
    if (text == null) return '';
    if (text.length < 80) return text;
    return `${text.substring(0, 33)} (..) ${text.substring(text.length - 34, text.length)}`;
}
