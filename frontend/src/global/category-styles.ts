import { each } from 'lodash';

import Graph from '../common-rdf/graph';
import CategoryStyling from '../category-colors/category-colors-view';
import { coloredClasses } from './ontology';
import { coloredClasses as coloredNLP } from './nlp-ontology';

const combinedOntology = new Graph();

each([coloredClasses, coloredNLP], ontology => {
    const add = () => combinedOntology.add(ontology.models);
    add();
    ontology.on('update reset', add);
});

export default new CategoryStyling({ collection: combinedOntology });
