import { omit, defaults } from 'lodash';
import FancyModel from '../core/fancy-model';

import Annotation from './annotation';
import AnnotationCollection from './annotation-collection';
import Collection from './../core/collection';

export default class Source extends FancyModel {
    annotations: AnnotationCollection;

    parse(json, options): any {
        let { annotations } = json;
        this.annotations = new AnnotationCollection(annotations);
        return omit(json, 'annotations');
    }

    toJSON() {
        return defaults({annotations: this.annotations.toJSON()}, super.toJSON());
    }
}
