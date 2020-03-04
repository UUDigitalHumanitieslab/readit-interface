import Fsm from '../core/fsm';

const DirectionFsm = Fsm.extend({
    initialState: 'travelling',
    states: {
        travelling: {
            arrive: 'arriving',
            leave: 'leaving',
            explore: 'exploring',
            register: 'registering',
            confirm: 'confirming',
        },
        arriving: {
            leave: 'leaving',
            explore: 'exploring',
            confirm: 'confirming',
        },
        leaving: {
            arrive: 'arriving',
        },
        exploring: {
            leave: 'leaving',
            arrive: 'arriving',
        },
        registering: {
            leave: 'leaving',
        },
        confirming: {
            leave: 'leaving',
            arrive: 'arriving',
        }
    },
});

export default DirectionFsm;
