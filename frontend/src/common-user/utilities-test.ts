import { each, constant } from 'lodash';

import { source1instance } from '../mock-data/mock-sources';

import Model from '../core/model';
import { dcterms, staff } from '../common-rdf/ns';
import Subject from '../common-rdf/subject';
import FlatItem from '../common-adapters/flat-item-model';

import userChannel from './user-radio';
import { currentUserOwnsModel } from './utilities';

// Different mock users, two of which qualify and two of which don't.
const owner = new Model({username: 'AHebing'});
const other = new Model({username: 'JGonggrijp'});
const anonymous = new Model();
const admin = new Model({username: 'admin', is_superuser: true});

// Different flavors of models that can be passed through
// `currentUserOwnsModel`. We will try all possible combinations of user and
// model.
const source = new Subject(source1instance);
const sharedSource = (source.clone() as Subject)
// Note that, due to the modified semantics of `Subject.set`, `sharedSource` will
// have two values for `dcterms.creator`.
.set(dcterms.creator, {'@id': staff('BJanssen')});
const wrappedSource = new FlatItem(source);
const bareCreator = source.get(dcterms.creator)[0] as unknown as Subject;

describe('common user utilities', function() {
    describe('currentUserOwnsModel', function() {
        beforeAll(function(done) {
            wrappedSource.when('creator', done);
        });

        each({owner, other, anonymous, admin}, function(user, userLabel) {
            let expected = false;
            if (userLabel === 'owner' || userLabel === 'admin') {
                expected = true;
            }

            each({
                source, sharedSource, wrappedSource, bareCreator
            }, function(model, modelLabel) {
                const description = `returns ${expected} for ${userLabel} with ${modelLabel}`;
                it(description, function() {
                    userChannel.reply('user', constant(user));
                    expect(currentUserOwnsModel(model)).toBe(expected);
                    userChannel.stopReplying('user');
                });
            });
        });
    });
});
