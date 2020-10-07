import User from '../user/user-model';
import userChannel from '../user/radio';
import ldChannel from '../jsonld/radio';
import { staff } from '../jsonld/ns';

const user = new User();

function getUserURI() {
    const username = user.get('username');
    if (username) return staff(username);
}

ldChannel.reply('current-user-uri', getUserURI);
userChannel.reply('permission', user.hasPermission, user);

export default user;
