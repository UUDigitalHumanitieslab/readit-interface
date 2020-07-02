import { history } from 'backbone';

import Graph from '../jsonld/graph';
import SourceListView from '../panel-source-list/source-list-view';
import ExplorerView from '../panel-explorer/explorer-view';

import footerView from '../global/footer-view';
import menuView from '../global/menu-view';
import welcomeView from '../global/welcome-view';
import feedbackView from '../global/feedback-view';
import uploadSourceForm from '../global/upload-source-form';
import registrationFormView from '../global/registration-view';
import confirmRegistrationView from '../global/confirm-registration-view';
import categoryStyles from '../global/category-styles';
import user from '../global/user';
import directionRouter from '../global/direction-router';
import userFsm from '../global/user-fsm';
import directionFsm from '../global/direction-fsm';
import sources, { ensureSources } from '../global/sources';

let explorerView;

history.once('route', () => {
    menuView.render().$el.appendTo('#header');
    menuView.on('feedback', () => { feedbackView.render().$el.appendTo('body'); });
    feedbackView.on('close', () => feedbackView.$el.detach());
    footerView.render().$el.appendTo('.footer');
    categoryStyles.$el.appendTo('body');
});

directionRouter.on('route:register', () => {
    userFsm.handle('register');
});

directionRouter.on('route:confirm-registration', (key) => {
    user.on('confirm-registration:success', () => confirmRegistrationView.success());
    user.on('confirm-registration:notfound', () => confirmRegistrationView.notFound());
    user.on('confirm-registration:error', (response) => confirmRegistrationView.error(response));
    confirmRegistrationView.processKey(key);
    directionFsm.handle('confirm');
});

directionFsm.on('enter:confirming', () => {
    confirmRegistrationView.render().$el.appendTo('#main');
});

directionFsm.on('exit:confirming', () => {
    confirmRegistrationView.$el.detach();
});

directionRouter.on('route:arrive', () => {
    directionFsm.handle('arrive');
    userFsm.handle('arrive');
});

userFsm.on('enter:arriving', () => {
    welcomeView.render().$el.appendTo('#main');
});

userFsm.on('exit:arriving', () => {
    welcomeView.$el.detach();
});

directionRouter.on('route:upload', () => {
    userFsm.handle('upload');
});

userFsm.on('enter:uploading', () => {
    uploadSourceForm.setHeight(getViewportHeight());
    uploadSourceForm.render().$el.appendTo('#main');
});

userFsm.on('exit:uploading', () => {
    uploadSourceForm.reset();
    uploadSourceForm.$el.detach();
});

directionRouter.on('route:explore', () => {
    userFsm.handle('explore');
});

userFsm.on('enter:exploring', () => {
    welcomeView.$el.detach();
    initSourceList();
});

userFsm.on('exit:exploring', () => {
    if (explorerView) explorerView.$el.detach();
});


directionRouter.on('route:leave', () => {
    userFsm.handle('leave');
});

/**
 * Get the heigth of the available vertical space.
 * Compensates for menu and footer, and 555 is min-height.
 */
function getViewportHeight(): number {
    let vh = $(window).height();
    // 133 is the height of the footer (got this number by manually testing)
    // Note that the same number needs to be the height of the 'push' class in main.sass
    return Math.max(vh - 160, 555);
}

function initSourceList() {
    ensureSources();
    let sourceListView = new SourceListView({ collection: sources });
    explorerView = new ExplorerView({ first: sourceListView });

    explorerView.setHeight(getViewportHeight());
    explorerView.render().$el.appendTo('#main');
}
