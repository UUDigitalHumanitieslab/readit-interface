import User from '../core/user-model';
import userChannel from '../core/user-radio';
import ldChannel from '../core/radio';
import { staff } from '../core/ns';

const user = new User();

function getUserURI() {
    const username = user.get('username');
    if (username) return staff(username);
}

ldChannel.reply('current-user-uri', getUserURI);
userChannel.reply('permission', user.hasPermission, user);

export default user;
