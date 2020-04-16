import { times, each } from 'lodash';
import { $ } from 'backbone';

import loremIpsum from '../lorem-ipsum';

const WebKitChunkSize = 65536;
const minimum = 10 * WebKitChunkSize;
const repeats = Math.ceil(minimum / loremIpsum.length);
const bigText = times(repeats, () => loremIpsum).join('');

describe('the WebKit chunking issue', function() {
    it('can be reproduced in a unittest', function() {
        expect(bigText.length).toBeGreaterThan(WebKitChunkSize);
        const testElement = $(`<p>${bigText}</p>`);
        testElement.appendTo('body');
        const chunks = testElement.get(0).childNodes;
        if (chunks.length === 1) pending('This browser does not chunk.');
        // Fail the test on different chunk size, because we may need to address
        // that.
        each(chunks, (chunk, index) => {
            const length = (chunk as Text).length;
            if (index === chunks.length - 1) {
                expect(length).toBe(bigText.length % WebKitChunkSize);
            } else {
                expect(length).toBe(WebKitChunkSize);
            }
        });
        testElement.remove();
    });

    it('can be solved by calling containingElement.normalize()', function() {
        const testElement = $(`<p>${bigText}</p>`);
        testElement.appendTo('body');
        let chunks = testElement.get(0).childNodes;
        if (chunks.length === 1) pending('This browser does not chunk.');
        testElement.get(0).normalize();
        expect(testElement.text()).toBe(bigText);
        chunks = testElement.get(0).childNodes;
        expect(chunks.length).toBe(1);
        expect((chunks[0] as Text).length).toBe(bigText.length);
        testElement.remove();
    });

    it('can be solved by appending the text later', function() {
        const testElement = $('<p>').text(bigText);
        testElement.appendTo('body');
        expect(testElement.text()).toBe(bigText);
        let chunks = testElement.get(0).childNodes;
        expect(chunks.length).toBe(1);
        expect((chunks[0] as Text).length).toBe(bigText.length);
        testElement.remove();
    });
});
