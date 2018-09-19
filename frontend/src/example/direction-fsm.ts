import Fsm from '../core/fsm';

const DirectionFsm = Fsm.extend({
    initialState: 'travelling',
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

export default DirectionFsm;
