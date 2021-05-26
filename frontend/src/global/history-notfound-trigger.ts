import { history } from 'backbone';

// In this module, we wrap Backbone.history's internal loadUrl method so that it
// will trigger a `'notfound'` event when the current route does not match any
// known route. TODO: contribute this to Backbone.
const originalLoadUrl = history.loadUrl;

history.loadUrl = function(fragment) {
    const result = originalLoadUrl.call(this, fragment);
    if (!result) this.trigger('notfound');
    return result;
}
