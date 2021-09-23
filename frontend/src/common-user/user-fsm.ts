import { defaults } from 'lodash';

import AuthorizationFsm, { requireAuthorization } from './user-fsm-base';

/**
 * Default transitions for states that don't require authorization.
 * See the "arriving" state below for an example of how to extend
 * this.
 */
const unprivilegedState = {
    leave: 'leaving',
    search: requireAuthorization,
    explore: requireAuthorization,
    upload: requireAuthorization,
    landing: requireAuthorization,
    confirm: 'confirming',
    notfound: 'lost',
};

/**
 * Default transitions for states that require authorization. See
 * the "arriving" state below for an example of how to extend this.
 */
const privilegedState = {
    leave: 'leaving',
    search: 'searching',
    explore: 'exploring',
    upload: 'uploading',
    land: 'landing',
    confirm: 'confirming',
    notfound: 'lost',
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
        leaving: unprivilegedState,
        searching: privilegedState,
        authorizationGranted: privilegedState,
        exploring: privilegedState,
        uploading: privilegedState,
        landing: privilegedState,
        confirming: unprivilegedState,
        lost: unprivilegedState,
    },
});
