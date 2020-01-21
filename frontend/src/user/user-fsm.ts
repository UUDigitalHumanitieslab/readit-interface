import { defaults } from 'lodash';

import AuthorizationFsm, { requireAuthorization } from './user-fsm-base';

/**
 * Default transitions for states that don't require authorization.
 * See the "arriving" state below for an example of how to extend
 * this.
 */
const unprivilegedState = {
    arrive: requireAuthorization,
    leave: 'leaving',
    explore: requireAuthorization,
    upload: requireAuthorization,
};

/**
 * Default transitions for states that require authorization. See
 * the "arriving" state below for an example of how to extend this.
 */
const privilegedState = {
    arrive: 'arriving',
    leave: 'leaving',
    explore: 'exploring',
    upload: 'uploading',
};

/**
 * The main states that the human in the chair can occupy.
 * Authorization-aware thanks to AuthorizationFsm base class.
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
        exploring: privilegedState,
        uploading: privilegedState,
    },
});
