import { extend } from 'lodash';

import ButtonView from './button-view';
import removeButtonTemplate from './remove-button-template';

export default class RemoveButton extends ButtonView {}
extend(RemoveButton.prototype, {
    template: removeButtonTemplate,
});
