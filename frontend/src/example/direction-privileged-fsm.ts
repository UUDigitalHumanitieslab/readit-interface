import UnprivilegedFsm from './direction-fsm';

/**
 * Deep-extends UnprivilegedFsm, so all states and transitions from
 * that class automatically carry over to this one.
 * @class
 */
const PrivilegedFsm = UnprivilegedFsm.extend({
    states: {
        travelling: {
            arrive: 'arriving',
        },
        arriving: {
            leave: 'leaving',
        },
        leaving: {
            arrive: 'arriving',
        },
    },
});

export default PrivilegedFsm;
