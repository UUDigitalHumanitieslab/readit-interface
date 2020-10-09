
import { extend } from 'lodash';

import LabelView from './label-view';

export default class OntologyItemView extends LabelView {

    onClick() {
        this.model.trigger('focus', this, this.model);
    }
}
extend(LabelView.prototype, {
    tagName: 'span',
    className: 'tag',
    events: {
        click: 'onClick'
    }
});
