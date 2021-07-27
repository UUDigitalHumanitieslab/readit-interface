import { ViewOptions } from 'backbone';
import { extend } from 'lodash';
import View from '../core/view';

export default class LoadingSpinnerView extends View {

    constructor(options?: ViewOptions) {
        super(options);
        this.render();
    }

}
extend(LoadingSpinnerView.prototype, {
    tagName: 'div',
    className: 'loader',
});
