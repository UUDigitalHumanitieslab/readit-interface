import CategoryStyling from '../category-colors/category-colors-view';
import ontology from './ontology';
import nlpOntology from './nlp-ontology';
import Graph from '../common-rdf/graph';
import { placeholderClass } from '../utilities/annotation-utilities';

let collection = new Graph(ontology.models.concat(nlpOntology.models).concat(placeholderClass));
export default new CategoryStyling({ collection: collection });
