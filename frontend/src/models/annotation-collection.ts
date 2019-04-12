import { extend } from 'lodash';
import Collection from '../core/collection';
import * as _ from 'underscore';

import Annotation from './annotation';

export default class AnnotationCollection extends Collection {
    
}
extend(AnnotationCollection.prototype, {
    model: Annotation,
    url: 'api/annotation',
})