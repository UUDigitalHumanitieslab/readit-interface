import { defaults } from 'lodash';

import AuthorizationFsm, { requireAuthorization } from '../user/user-fsm-base';

/**
 * Default transitions for states that don't require authorization.
 * See the "arriving" state below for an example of how to extend
 * this.
 */
const unprivilegedState = {
    arrive: requireAuthorization,
    leave: 'leaving',
};

/**
 * Default transitions for states that require authorization. See
 * the "arriving" state below for an example of how to extend this.
 */
const privilegedState = {
    arrive: 'arriving',
    leave: 'leaving',
};

/**
 * The main states that the user can occupy.
 * Authorization-aware, privilege levels could be more fine-grained.
 * @class
 */
export default AuthorizationFsm.extend({
    initialState: 'travelling',
    // Deep-extend, so includes the states and transitions from
    // AuthorizationFsm.
    states: {
        travelling: unprivilegedState,
        arriving: defaults({
            // Special case for the arriving state.
            // Other privileged states may have different logout handlers.
            logout: 'leaving',
        }, privilegedState),
        leaving: unprivilegedState,
        authorizationGranted: privilegedState,
    },
});
