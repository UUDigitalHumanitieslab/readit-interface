import Fsm from '../core/fsm';

/**
 * The following FSM class is meant to be extended when you create an
 * FSM to represent the current activity (state) of the human sitting
 * in the chair behind the computer. By extending this base class,
 * your FSM gains the power to be aware of the need to authorize for
 * certain activities.
 *
 * To indicate that a transition requires authorization, use the
 * auxiliary function requireAuthorization. See below.
 *
 * Often, there is a navigation menu which allows the human in the
 * chair to switch in any direction between the activities that are
 * available from the menu. Some of these activities require
 * authorization while others do not. If you define each state
 * individually, you will probably end up repeating yourself a lot,
 * so we suggest a pattern like the following instead. Define two
 * standard transition tables, one for unprivileged activities and
 * one for activities that require authorization:

        const unprivilegedTransitions = {
            work: 'finishHomework',
            drink: 'sipCoffee',
            play: requireAuthorization,
            pet: requireAuthorization,
        };
        const privilegedTransitions = {
            work: 'finishHomework',
            drink: 'sipCoffee',
            play: 'playPong',
            pet: 'petTheCat',
        };

 * then, reuse the tables in your states. You can make extensions and
 * exceptions using _.defaults.

        const UserActivity = UserBaseFsm.extend({
            states: {
                finishHomework: unprivilegedTransitions,
                sipCoffee: unprivilegedTransitions,
                playPong: _.defaults({
                    pet: requireAuthorization,
                }, privilegedTransitions),
                petTheCat: privilegedTransitions,
                authorizationGranted: privilegedTransitions,
            },
        });

 * Note that we basically use the privilegedTransitions for states
 * that can only be entered with authorization and the
 * unprivilegedTransitions for the other states. The default
 * behaviour in the privilegedTransitions is to assume that the user
 * is still authorized. In the example above, we override this to
 * double-check authorization when transitioning from playPong to
 * petTheCat.
 *
 * Also note that we extend authorizationGranted with the same
 * transitions as the already-authorized activities. This example
 * does not illustrate how to deal with authorization failures;
 * typically, you'll want to handle this from the outside by
 * listening for the enter:authorizationDenied event.
 *
 * @class
 */
export default Fsm.extend({
    states: {
        // Temporary state when authorization has just failed. Handle
        // by listening for the enter:authorizationDenied event.
        // Depending on how you plan to handle this situation, you
        // may want to keep track of previous states.
        authorizationDenied: {
            _onEnter: function() {
                this.clearQueue('transition', 'authorizationGranted');
            },
        },
        // Temporary state after a transition from an unprivileged to
        // a privileged state has been requested.
        requestAuthorization: {
            denied: 'authorizationDenied',
            granted: 'authorizationGranted',
            authenticated: 'authorizationGranted',
        },
        // Temporary state after successful authorization. Extend as
        // if this is a regular privileged state. Will receive queued
        // inputs from everywhere the requireAuthorization transition
        // is used.
        authorizationGranted: {},
    },
});

/**
 * Handler for transitions that require authorization.
 */
export function requireAuthorization() {
    this.deferUntilTransition('authorizationGranted');
    this.transition('requestAuthorization');
}
