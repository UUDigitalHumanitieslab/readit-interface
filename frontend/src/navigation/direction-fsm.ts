import Fsm from '../core/fsm';

const DirectionFsm = Fsm.extend({
    initialState: 'travelling',
    states: {
        travelling: {
            arrive: 'arriving',
            leave: 'leaving',
            explore: 'exploring',
        },
        arriving: {
            leave: 'leaving',
            explore: 'exploring',
        },
        leaving: {
            arrive: 'arriving',
        },
        exploring: {
            leave: 'leaving',
            arrive: 'arriving',
        }
    },
});

export default DirectionFsm;
