import { extend } from 'lodash';
import View from './../core/view';

export default class MetadataView extends View {
    /**
     * Class to show source's metadata
     */

    initialize(): this {
        console.log(this.$el);
        return this;
    }

    render(): this {
        return this;
    }
}