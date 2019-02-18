import Fsm from '../core/fsm';

const DirectionFsm = Fsm.extend({
    initialState: 'travelling',
    states: {
        travelling: {
            arrive: 'arriving',
            leave: 'leaving',
            search: 'searching',
        },
        arriving: {
            leave: 'leaving',
            search: 'searching'
        },
        leaving: {
            arrive: 'arriving',
        },
        searching: {
            
        },
    },
});

export default DirectionFsm;
