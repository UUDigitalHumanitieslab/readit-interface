import { constant } from 'lodash';

import semChannel from '../semantic-search/radio';
import Queries from '../semantic-search/collection';

const userQueries = new Queries();

semChannel.reply('userQueries', constant(userQueries));
userQueries.listenTo(semChannel, 'addUserQuery', userQueries.add);
