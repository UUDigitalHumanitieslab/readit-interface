import Fsm from '../core/fsm';

const DirectionFsm = Fsm.extend({
    initialState: 'travelling',
    states: {
        travelling: {
            arrive: 'arriving',
            annotate: 'annotating',
            leave: 'leaving',
        },
        arriving: {
            leave: 'leaving',
            annotate: 'annotating',
        },
        leaving: {
            arrive: 'arriving',
        },
        annotating: {
            search: 'searching',
            leave: 'leaving',
        }
    },
});

export default DirectionFsm;
