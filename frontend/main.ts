import bb from 'backbone';

import domReady from './global/dom-ready';
import './aspects/example';

domReady.then(function($) {
    bb.history.start();
});
