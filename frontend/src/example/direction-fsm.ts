import { noop } from 'lodash';

import Fsm from '../core/fsm';

const DirectionFsm = Fsm.extend({
    initialState: 'travelling',
    states: {
        travelling: {
            leave: 'leaving',
        },
        leaving: {
            leave: noop,
        },
    },
});

export default DirectionFsm;
