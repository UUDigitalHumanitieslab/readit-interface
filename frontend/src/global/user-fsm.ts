import UserFsm from '../user/user-fsm';

export default new UserFsm({
    // Deep-extend. Includes all states and transitions from UserFsm.
    states: {
        requestAuthorization: {
            // authenticated is one of the possible states of the
            // global authentication FSM.
            authenticated: 'authorizationGranted',
        },
    },
});
