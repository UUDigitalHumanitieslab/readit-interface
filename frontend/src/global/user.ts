import { constant } from 'lodash';

import User from '../common-user/user-model';
import userChannel from '../common-user/user-radio';
import { staff } from '../common-rdf/ns';

const user = new User();
const returnUser = constant(user);
const promise = user.fetch().then(() => {
    if (user.has('username')) user.trigger('login:success', user);
}).then(returnUser);

function getUserURI() {
    const username = user.get('username');
    if (username) return staff(username);
}

userChannel.reply('user', returnUser);
userChannel.reply('promise', constant(promise));
userChannel.reply('current-user-uri', getUserURI);
userChannel.reply('permission', user.hasPermission, user);

export default user;
