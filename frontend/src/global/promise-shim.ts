/**
 * Miniature ES6 Promise polyfill based on jQuery.Deferred.
 *
 * jQuery 3 is Promises/A+ compliant, so this should be good enough for
 * most situations in which jQuery is being imported anyway.
 */

import * as $ from 'jquery';

function toPromise(deferred, target?) {
    const promise = deferred.promise(target);
    promise.finally = promise.always;
    return promise;
}

class Promise {
    constructor(executor) {
        const deferred = $.Deferred();
        toPromise(deferred, this);
        const resolve = deferred.resolve.bind(deferred),
            reject = deferred.reject.bind(deferred);
        executor(resolve, reject);
    }

    static all(iterable) {
        return toPromise($.when.apply($, iterable));
    }

    static race(iterable) {
        const deferred = $.Deferred();
        function resolved(value) {
            if (deferred.state() === 'pending') deferred.resolve(value);
        }
        function rejected(reason) {
            if (deferred.state() === 'pending') deferred.reject(reason);
        }
        $.each(iterable, (key, promise) => promise.then(resolved, rejected));
        return toPromise(deferred);
    }

    static resolve(value) {
        return new Promise((resolve, reject) => {
            if (value.then && value.then instanceof Function) {
                value.then(resolve, reject);
            } else {
                resolve(value);
            }
        });
    }

    static reject(reason) {
        return new Promise((resolve, reject) => reject(reason));
    }
}

const local = global || self || window || Function('return this')();

if (local && !local.Promise) local.Promise = Promise;
