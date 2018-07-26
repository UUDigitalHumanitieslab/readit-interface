import FancyModel from '../core/fancy-model';

export default class ExampleModel extends FancyModel {
    defaultOptions = {
        property1: 'ant',
        property2: 'bee',
    };
    defaults() {
        return this.defaultOptions;
    };
    swapProperties() {
        let temp = this.get('property1');
        this.set('property1', this.get('property2'));
        this.set('property2', temp);
        return this;
    }
}
