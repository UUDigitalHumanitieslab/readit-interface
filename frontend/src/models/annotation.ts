import { extend } from 'lodash';
import FancyModel from '../core/fancy-model';

import Source from '../models/source';

export default class Annotation extends FancyModel {
}

extend (Annotation.prototype, {
    url: 'api/annotation/',
})