import { history } from 'backbone';

import footerView from '../global/footer-view';
import menuView from '../global/menu-view';
import welcomeView from '../global/welcome-view';
import feedbackView from '../global/feedback-view';
import uploadSourceForm from '../global/upload-source-form';
import categoryStyles from '../global/category-styles';
import user from '../global/user';
import mainRouter from '../global/main-router';
import userFsm from '../global/user-fsm';
import { ensureSources } from '../global/sources';
import explorerView from '../global/explorer-view';

history.once('route', () => {
    menuView.render().$el.appendTo('#header');
    footerView.render().$el.appendTo('.footer');
    categoryStyles.$el.appendTo('body');
    // 133 is the height of the footer (got this number by manually testing)
    // Note that the same number needs to be the height of the 'push' class in
    // main.sass. 555 is min-height.
    const availableHeight = Math.max($(window).height() - 160, 555);
    explorerView.setHeight(availableHeight).render();
    uploadSourceForm.setHeight(availableHeight);
});

mainRouter.on('route:arrive', () => userFsm.handle('arrive'));
mainRouter.on('route:upload', () => userFsm.handle('upload'));
mainRouter.on('route:explore', () => userFsm.handle('explore'));
mainRouter.on('route:leave', () => userFsm.handle('leave'));

userFsm.on('enter:arriving', () => welcomeView.render().$el.appendTo('#main'));
userFsm.on('exit:arriving', () => welcomeView.$el.detach());
userFsm.on('enter:uploading', () => {
    uploadSourceForm.render().$el.appendTo('#main');
});
userFsm.on('exit:uploading', () => {
    uploadSourceForm.reset();
    uploadSourceForm.$el.detach();
});
userFsm.on('enter:exploring', () => {
    ensureSources();
    explorerView.$el.appendTo('#main');
});
userFsm.on('exit:exploring', () => explorerView.$el.detach());

menuView.on('feedback', () => feedbackView.render().$el.appendTo('body'));

feedbackView.on('close', () => feedbackView.$el.detach());
