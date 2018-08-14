import example from '../global/example-model';
import exampleView from '../global/example-view';

exampleView.render().$el.appendTo(document.body);
exampleView.listenTo(example, 'change:property1', exampleView.render);
