import directionRouter from '../global/ex_direction-router';
import directionFsm from '../global/ex_direction-fsm';
import enterView from '../global/ex_enter-view';
import exitView from '../global/ex_exit-view';
import logoBannerView from '../global/ex_logoBanner-view';
import menuView from '../global/ex_menu-view';

menuView.render().$el.prependTo('#hero-top');
logoBannerView.render().$el.appendTo('#hero-top');

directionRouter.on('route:arrive', () => directionFsm.handle('arrive'));
directionRouter.on('route:leave', () => directionFsm.handle('leave'));
directionFsm.on('enter:arriving', () => enterView.render().$el.insertAfter('.hero-head'));
directionFsm.on('exit:arriving', () => enterView.$el.detach());
directionFsm.on('enter:leaving', () => exitView.render().$el.insertAfter('.hero-head'));
directionFsm.on('exit:leaving', () => exitView.$el.detach());
