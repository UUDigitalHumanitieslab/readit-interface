import example from '../global/example-model';
import exampleView from '../global/example-view';
import { i18nPromise } from '../global/i18n';

// Normally the promise wouldn't be required. It is only used in this
// example because we are not waiting for bb.history.start() before
// rendering. This will be fixed in a later commit.
i18nPromise.then(() => exampleView.render().$el.appendTo(document.body));
exampleView.listenTo(example, 'change:property1', exampleView.render);
