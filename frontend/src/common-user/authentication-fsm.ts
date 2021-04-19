import { noop } from 'lodash';

import Fsm from '../core/fsm';

/**
 * Simple FSM that represents whether a user has authenticated with
 * the backend or not.
 * @class
 */
export default Fsm.extend({
    initialState: 'unauthenticated',
    states: {
        unauthenticated: {
            login: 'attemptLogin',
            loginSuccess: 'authenticated',
            register: 'registering',
        },
        attemptLogin: {
            register: 'registering',
            loginSuccess: 'authenticated',
            loginFail: noop,
            loginCancel: 'unauthenticated',
        },
        authenticated: {
            logout: 'unauthenticated',
        },
        registering: {
            login: 'attemptLogin',
        }
    },
});
