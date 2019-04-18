import user from '../global/user';
import userFsm from '../global/user-fsm';
import authFsm from '../global/authentication-fsm';
import loginForm from '../global/login-view';

let formerUserState: string = userFsm.state;

user.on('login:success', () => authFsm.handle('loginSuccess'));
user.on('login:error', () => authFsm.handle('loginFail'));
user.on('logout:success', () => authFsm.handle('logout'));

userFsm.on('enter:authorizationDenied', () => {
    window.history.back();
    userFsm.transition(formerUserState);
});
userFsm.on('enter:requestAuthorization', (fsm, action) => {    
    let [formerState, input] = action.split('.');
    formerUserState = formerState;
    userFsm.handle(authFsm.state);
    authFsm.handle('login');
});

authFsm.on('enter:unauthenticated', () => userFsm.handle('denied'));
authFsm.on('enter:attemptLogin', () => loginForm.render().$el.appendTo('body'));
authFsm.on('exit:attemptLogin', () => loginForm.$el.detach());
authFsm.on('enter:authenticated', () => userFsm.handle('granted'));
authFsm.on('exit:authenticated', () => userFsm.handle('logout'));

loginForm.on('submit', credentials => user.login(credentials));
loginForm.on('cancel', () => authFsm.handle('loginCancel'));
