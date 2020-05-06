import { nextTick } from 'async';

// The code in this module was inspired on the following blog post:
// https://dbaron.org/log/20100309-faster-timeouts
// In this module, we use a different name, enable passing arguments and use ES6
// syntax.

const timeouts = [];
const messageName = "readit-fast-timeout-message";

function handleMessage(event) {
    if (event.source === window && event.data === messageName) {
        event.stopPropagation();
        if (timeouts.length > 0) {
            const { fn, args } = timeouts.shift();
            fn(...args);
        }
    }
}

window.addEventListener("message", handleMessage, true);

// Like setTimeout, but takes no time argument (always zero) and is faster in
// real browsers. setTimeout is throttled to 2-10 ms intervals.
function fastTimeout(fn, ...args) {
    timeouts.push({ fn, args });
    window.postMessage(messageName, "*");
}

// Doesn't work in JSDOM, so we fallback to async.nextTick for JSDOM.
export default document.hidden ? nextTick : fastTimeout;
