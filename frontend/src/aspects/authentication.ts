import user from '../global/user';
import userFsm from '../global/user-fsm';
import authFsm from '../global/authentication-fsm';
import loginForm from '../global/login-view';
import menuView from '../global/menu-view';


/**
 * In this module, we work our magic to ensure that the user is shown
 * a login form when necessary and that she can see exactly those
 * parts of the application that she has the appropriate access
 * rights for.
 *
 * To understand what's going on, a few key concepts are important to
 * keep in mind:
 *
 *  - _Authentication_ is the process of determining whether an agent
 *    is really the agent it claims to be. The imported `authFsm`
 *    keeps track of authentication state. In our case, the agent is
 *    the human in the chair operating the web browser. She might
 *    claim to be the owner of a particular account.
 *  - _Authorization_ is the process of determining whether an agent
 *    has the right to perform a particular action ("privilege").
 *    Generally, this requires authentication, unless the action is
 *    available to the general public. Additional rights might be
 *    needed on top of this, although this is not presently the case
 *    in our application. The imported `userFsm` keeps track of the
 *    action our human is currently trying to perform and takes
 *    authorization into account.
 *  - Aspect modules such as this one are programmed entirely by
 *    binding events to handlers. These handlers may in turn cause
 *    other events to be emitted. As a result, there is no single
 *    linear order in which the handlers will be executed, but a
 *    network of events and handlers with multiple entry points. One
 *    may refer to this as "timeless programming" and it takes some
 *    getting used to. Do not try to mentally coerce the code into a
 *    linear order, because this does not help your understanding.
 *    Instead, accept the network and keep asking yourself a single
 *    question while reading and editing the code: if event X occurs,
 *    what do you want to happen next?
 */

// Keep track of the last unprivileged user state, because we return
// to it when authentication fails.
let formerUserState: string = userFsm.state;

user.on('login:success', () => authFsm.handle('loginSuccess'));
user.on('login:error', () => {
    authFsm.handle('loginFail');
    loginForm.onLoginFailed();

});
user.on('logout:success', () => authFsm.handle('logout'));

// When authorization fails, just return to the last unprivileged state.
userFsm.on('enter:authorizationDenied', () => {
    window.history.back();  // incorrect if navigated from other site
    userFsm.transition(formerUserState);
});

// User tries to transition from an unprivileged to a privileged state.
userFsm.on('enter:requestAuthorization', (fsm, action) => {
    // Get hold of the unprivileged state so we can return to it.
    let [formerState, input] = action.split('.');
    formerUserState = formerState;
    // If already authenticated, transition directly to authorized.
    // (This relies on our addition in ../global/user-fsm).
    userFsm.handle(authFsm.state);
    // Try to authenticate if not already trying (or successful).
    authFsm.handle('login');
});

authFsm.on('enter:unauthenticated', () => userFsm.handle('denied'));
authFsm.on('enter:attemptLogin', () => loginForm.render().$el.appendTo('body'));
authFsm.on('exit:attemptLogin', () => loginForm.$el.detach());
authFsm.on('enter:authenticated', () => userFsm.handle('granted'));
authFsm.on('exit:authenticated', () => userFsm.handle('logout'));

loginForm.on('submit', credentials => user.login(credentials));
loginForm.on('cancel', () => authFsm.handle('loginCancel'));
loginForm.on('register', () => authFsm.handle('register'));

menuView.on('logout', () => user.logout());
