import { noop } from 'lodash';

import Fsm from '../core/fsm';

/**
 * Make this FSM the top of a hierarchy. The unauthenticated and
 * authenticated states should each get a _child FSM that provides
 * the available states for that condition.
 * @class
 */
export default Fsm.extend({
    initialState: 'unauthenticated',
    states: {
        unauthenticated: {
            // Forget about any previously deferred inputs.
            _onEnter: function() {
                this.clearQueue();
            },
            // By default, forward to login on any input.
            // Exceptions can be made by extending with a _child when
            // creating an instance.
            '*': function() {
                this.deferAndTransition('attemptLogin');
            },
        },
        attemptLogin: {
            loginSuccess: 'authenticated',
            loginFail: noop,
            loginCancel: 'unauthenticated',
            // Keep deferred inputs around so they replay again when
            // we enter another state.
            '*': function() {
                this.deferUntilTransition();
            },
        },
        authenticated: {
            logout: 'unauthenticated',
            // By default, this is a no-op sink for all inputs.
            // Extend with a _child to make something happen when
            // creating an instance.
        },
    },
});
