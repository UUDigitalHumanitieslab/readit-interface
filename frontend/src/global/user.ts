import User from '../common-user/user-model';
import userChannel from '../common-user/user-radio';
import ldChannel from '../common-rdf/radio';
import { staff } from '../common-rdf/ns';

const user = new User();

function getUserURI() {
    const username = user.get('username');
    if (username) return staff(username);
}

ldChannel.reply('current-user-uri', getUserURI);
userChannel.reply('permission', user.hasPermission, user);

export default user;
