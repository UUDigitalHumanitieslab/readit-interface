import example from '../global/example-model';
import exampleView from '../global/example-view';

exampleView.listenTo(example, 'change:property1', exampleView.render);
