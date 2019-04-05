import { extend } from 'lodash';
import * as _ from 'underscore';
import View from '../../core/view';

import annoWelcomeTemplate from './anno-welcome-template';

export default class AnnoWelcomeView extends View {
    

    render(): View {        
        this.$el.html(this.template({}));
        return this;
    }

    initialize(): void {
        
    }
}
extend(AnnoWelcomeView.prototype, {
    tagName: 'section',
    className: 'section',
    template: annoWelcomeTemplate,
    events: {
        // 'mouseup .annotationWrapper': 'onTextSelected',        
    }
});
