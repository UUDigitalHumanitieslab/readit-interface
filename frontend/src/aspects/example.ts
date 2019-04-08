import { history } from 'backbone';

import directionRouter from '../global/ex_direction-router';
import directionFsm from '../global/ex_direction-fsm';
import exitView from '../global/ex_exit-view';
import footerView from '../global/footer-view';
import menuView from '../global/menu-view';

import annotateWelcomeView from '../global/annotate-welcome-view';
import annotateView from '../global/annotate-view';

history.once('route', () => {
    menuView.render().$el.appendTo('#header');
    footerView.render().$el.appendTo('.footer');
});

directionRouter.on('route:arrive', () => directionFsm.handle('arrive'));
directionRouter.on('route:leave', () => directionFsm.handle('leave'));
directionRouter.on('route:annotate', () => directionFsm.handle('annotate'));


directionFsm.on('enter:arriving', () => {
    annotateWelcomeView.render().$el.appendTo('#main')
});
directionFsm.on('exit:arriving', () => { 
    annotateWelcomeView.$el.detach();    
});

directionFsm.on('enter:annotating', () => {
    annotateView.renderInParent($('#main'));
});
directionFsm.on('exit:annotating', () => {
    annotateView.$el.detach();
});

directionFsm.on('enter:leaving', () => exitView.render().$el.insertAfter('.hero-head'));
directionFsm.on('exit:leaving', () => exitView.$el.detach());
