import { history } from 'backbone';

import directionRouter from '../global/ex_direction-router';
import directionFsm from '../global/ex_direction-fsm';
import exitView from '../global/ex_exit-view';
import footerView from '../global/footer-view';
import menuView from '../global/menu-view';

import annotateWelcomeView from '../global/annotate-welcome-view';

menuView.render().$el.appendTo('#header');
footerView.render().$el.appendTo('.footer');
annotateWelcomeView.render().$el.appendTo('#main');
