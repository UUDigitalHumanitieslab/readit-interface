import directionRouter from '../global/ex_direction-router';
import userFsm from '../global/user-fsm';
import enterView from '../global/ex_enter-view';
import exitView from '../global/ex_exit-view';

directionRouter.on('route:arrive', () => userFsm.handle('arrive'));
directionRouter.on('route:leave', () => userFsm.handle('leave'));
userFsm.on('enter:arriving', () => enterView.render().$el.appendTo('main'));
userFsm.on('exit:arriving', () => enterView.$el.detach());
userFsm.on('enter:leaving', () => exitView.render().$el.appendTo('main'));
userFsm.on('exit:leaving', () => exitView.$el.detach());
