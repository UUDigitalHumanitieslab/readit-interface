import Fsm from '../core/fsm';

const DirectionFsm = Fsm.extend({
    initialState: 'travelling',
    states: {
        travelling: {
            arrive: 'arriving',
            leave: 'leaving',
            search: 'searching',
            annotate: 'annotating',
        },
        arriving: {
            leave: 'leaving',
            search: 'searching',
            annotate: 'annotating',
        },
        leaving: {
            arrive: 'arriving',
        },
        searching: {
            annotate: 'annotating'
        },
        annotating: {
            search: 'searching'
        }
    },
});

export default DirectionFsm;
