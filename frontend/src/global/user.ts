import User from '../common-user/user-model';
import userChannel from '../common-user/user-radio';
import { staff } from '../common-rdf/ns';
import Model from '../core/model';

const user = new User();
let promise: PromiseLike<Model> = null;

function getUserURI() {
    return fetchUser().then( () => {
        const username = user.get('username');
        if (username) return staff(username);
    })
}

function getPermission(permission: string) {
    return fetchUser().then( () => {
        return user.hasPermission(permission);
    })
}

function fetchUser() {
    if (!promise) {
        promise = user.fetch().then(resolveUser, rejectUser);
    }
    return promise;
}

function resolveUser(): User {
    promise = Promise.resolve(user);
    return user;
}

function rejectUser(error) {
    promise = Promise.reject(error);
    return error;
}

userChannel.once('cache', fetchUser);
userChannel.reply('user', fetchUser);
userChannel.reply('current-user-uri', getUserURI);
userChannel.reply('permission', getPermission);

export default user;
