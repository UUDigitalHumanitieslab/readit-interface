import { isArray } from 'lodash';

import Model from '../core/model';
import { staff, dcterms } from '../common-rdf/ns';

import userChannel from './user-radio';

// Is the current user authorized to modify and delete the given model (or does
// the model itself already represent the user)?
// Runs sync. `await userChannel.request('promise')` if you might run the
// function before the current user is known. Use `model.when(creator)` if
// ownership of the model is not yet known.
export function currentUserOwnsModel(model: Model): boolean {
    const user = userChannel.request('user');
    // Unauthenticated users own nothing.
    if (!user || !user.has('username')) return false;
    // Superusers "own" everything.
    if (user.get('is_superuser')) return true;
    // In the remaining cases, we actually look at what we have.
    const userUri = staff(user.get('username'));
    let creator = model.get('creator') || model.get(dcterms.creator) || model;
    if (isArray(creator)) creator = creator[0];
    const creatorId = creator.id || creator['@id'];
    return creatorId === userUri;
}
