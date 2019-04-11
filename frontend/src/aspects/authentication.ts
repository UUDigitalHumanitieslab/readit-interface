import { history } from 'backbone';

import user from '../global/user';
import userFsm from '../global/user-fsm';
import loginForm from '../global/login-view';

user.on('login:success', () => userFsm.handle('loginSuccess'));
user.on('login:error', () => userFsm.handle('loginFail'));
user.on('logout:success', () => userFsm.handle('logout'));
user.on('all', (event, ...args) => console.log('user', event, args));

userFsm.on('enter:unauthenticated', (fsm, action) => {
    if (action === 'attemptLogin.loginCancel') window.history.back();
});
userFsm.on('enter:attemptLogin', () => loginForm.render().$el.appendTo('body'));
userFsm.on('exit:attemptLogin', () => loginForm.$el.detach());
userFsm.on('handling', payload => console.log('handling', payload));
userFsm.on('transition', payload => console.log('transition', payload));

loginForm.on('submit', credentials => user.login(credentials));
loginForm.on('cancel', () => userFsm.handle('loginCancel'));
loginForm.on('all', (event, ...args) => console.log('loginForm', event, args));
