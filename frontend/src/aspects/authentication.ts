import { history } from 'backbone';

import user from '../global/user';
import userFsm from '../global/user-fsm';
import loginForm from '../global/login-view';

user.on('login:success', () => userFsm.handle('loginSuccess'));
user.on('login:error', () => userFsm.handle('loginFail'));
user.on('logout:success', () => userFsm.handle('logout'));

userFsm.on('enter:unauthenticated', (fsm, action) => {
    if (action === 'attemptLogin.loginCancel') window.history.back();
});
userFsm.on('enter:attemptLogin', () => loginForm.render().$el.appendTo('body'));
userFsm.on('exit:attemptLogin', () => loginForm.$el.detach());

loginForm.on('submit', credentials => user.login(credentials));
loginForm.on('cancel', () => userFsm.handle('loginCancel'));
