import { Fsm } from 'machina';

/**
 * This is the base FSM class that all FSMs in the application
 * should derive from, either directly or indirectly. If you want to
 * apply a customization to all FSMs in the application, do it here.
 */
export default Fsm.extend({
    constructor() {
        let result = Fsm.apply(this, arguments);
        this.on('transition', ({fromState, toState, action}) => {
            this.emit(`exit:${fromState}`, this, action);
            this.emit(`enter:${toState}`, this, action);
        });
        return result;
    },
});
