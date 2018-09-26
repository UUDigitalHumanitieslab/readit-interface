import { startsWith } from 'lodash';
import { history } from 'backbone';

import View from './view';

// This view intercepts clicks on internal links and makes it possible
// to handle them without reloading our SPA.

export default class internalLinkEnabler extends View {
    el() {
        return document.body;
    }
    intercept(event) {
        const href = this.$(event.target).attr('href');
        if (!href || startsWith(href, 'http') || startsWith(href, '//')) return;
        event.preventDefault();
        history.navigate(href, {trigger: true});
    }
}

internalLinkEnabler.prototype.events = {
    'click a, area': 'intercept',
};
