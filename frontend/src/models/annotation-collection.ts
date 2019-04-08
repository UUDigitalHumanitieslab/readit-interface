import { extend } from 'lodash';
import Collection from '../core/collection';
import * as _ from 'underscore';

import Annotation from './annotation';
import mockAnnotations from './mock-annotations';

export default class AnnotationCollection extends Collection {
    getMockData() {
        var annotations: Annotation[] = [];
        
        for (let anno of (mockAnnotations)) {
            annotations.push(new Annotation(anno));
        }

        return annotations;
    }
}

extend(AnnotationCollection.prototype, {
    model: Annotation,
    fetch: function (options: any) {
        let categories = this.getMockData();
        this.set(categories)
        options.success(this, {}, {});
    }
})