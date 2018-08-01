import * as $ from 'jquery';

const deferred = $.Deferred();

$(function() {
    deferred.resolve($);
    // This is a completely useless way to resolve the promise.
    // Instead of importing domReady from this module and calling
    //      domReady.then(myFunc);
    // one can just import jquery directly and do
    //      $(myFunc);
    // I'm demonstrating this anyway, because it gets interesting if
    // we resolve with something that we often need to access once
    // the DOM has loaded, for example $('main').
});

export default deferred.promise();
