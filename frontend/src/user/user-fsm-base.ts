import Fsm from '../core/fsm';

/**
 * Handler for transitions that require authorization.
 */
export function requireAuthorization() {
    this.deferUntilTransition('authorizationGranted');
    this.transition('requestAuthorization');
}

/**
 * Extend this to make an authorization-sensitive FSM that represents
 * the user state.
 * More fine-grained authorization levels would be possible, too.
 * @class
 */
export default Fsm.extend({
    states: {
        authorizationDenied: {
            _onEnter: function() {
                this.clearQueue('transition', 'authorizationGranted');
            },
        },
        requestAuthorization: {
            denied: 'authorizationDenied',
            granted: 'authorizationGranted',
            authenticated: 'authorizationGranted',
        },
        authorizationGranted: {},
    },
});
