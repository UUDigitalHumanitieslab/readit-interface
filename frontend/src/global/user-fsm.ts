import AuthenticationFsm from '../user/authentication-fsm';
import unprivilegedFsm from './ex_direction-fsm';
import privilegedFsm from './ex_direction-privileged-fsm';

export default new AuthenticationFsm({
    states: {
        unauthenticated: {
            _child: unprivilegedFsm,
        },
        authenticated: {
            _child: privilegedFsm,
        },
    },
});
