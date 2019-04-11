import { omit, defaults } from 'lodash';
import FancyModel from '../core/fancy-model';

import Annotation from './annotation';
import Collection from '../core/collection';

export default class Source extends FancyModel {
    annotations: Collection<Annotation>;

    parse(json, options): any {
        let { annotations } = json;
        this.annotations = new Collection<Annotation>(annotations);
        return omit(json, 'annotations');
    }

    toJSON() {
        return defaults({annotations: this.annotations.toJSON()}, super.toJSON());
    }
}
