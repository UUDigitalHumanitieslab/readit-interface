import { extend } from 'lodash';

import ButtonView from './button-view';
import addButtonTemplate from './add-button-template';

export default class AddButton extends ButtonView {}
extend(AddButton.prototype, {
    template: addButtonTemplate,
});
