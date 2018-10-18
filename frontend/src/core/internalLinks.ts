import { startsWith } from 'lodash';
import { history } from 'backbone';

import View from './view';

const eventsHash = {
    'click a, area': 'intercept',
};

// This view intercepts clicks on internal links and makes it possible
// to handle them without reloading our SPA.

export default class internalLinkEnabler extends View {
    events() {
        return eventsHash;
    }
    intercept(event) {
        const href = this.$(event.target).attr('href');
        if (!href || startsWith(href, 'http') || startsWith(href, '//')) return;
        event.preventDefault();
        history.navigate(href, {trigger: true});
    }
}

internalLinkEnabler.prototype.el = function() {
    return document.body;
};
