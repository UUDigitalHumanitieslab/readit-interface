import User from '../user/user-model';
import ldChannel from '../jsonld/radio';
import { staff } from '../jsonld/ns';

const user = new User();

function getUserURI() {
    const username = user.get('username');
    if (username) return staff(username);
}

ldChannel.reply('current-user-uri', getUserURI);

export default user;
