import { extend } from 'lodash';
import Collection from '../core/collection';
import * as _ from 'underscore';

import Annotation from './annotation';

import { apiRoot } from 'config.json';

export default class AnnotationCollection extends Collection {
    
}
extend(AnnotationCollection.prototype, {
    model: Annotation,
    url: `${apiRoot}/annotation`,
})