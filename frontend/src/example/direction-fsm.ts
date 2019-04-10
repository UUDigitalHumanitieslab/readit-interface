import Fsm from '../core/fsm';

const DirectionFsm = Fsm.extend({
    initialState: 'travelling',
    states: {
        travelling: {
            leave: 'leaving',
        },
        leaving: {
        },
    },
});

export default DirectionFsm;
