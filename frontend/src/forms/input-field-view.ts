import { extend } from 'lodash';
import View from '../core/view';

export default class InputField extends View { }
extend(InputField.prototype, {
    tagName: 'input',
    className: 'input',
});