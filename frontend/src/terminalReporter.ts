import * as Reporter from 'jasmine-terminal-reporter';

const splitter = '\n';
const buffer: string[] = [];

function output(text: string): void {
    if (text === '') return;
    console.info(text);
}

function print(text: string): void {
    if (text.includes(splitter)) {
        const parts = text.split(splitter);
        buffer.push(parts.shift());
        output(buffer.join(''));
        buffer.splice(0);
        if (!text.endsWith(splitter)) buffer.push(parts.pop());
        parts.forEach(output);
    } else {
        buffer.push(text);
    }
}

const env = jasmine.getEnv();
const reporter = new Reporter({
    print,
});

env.addReporter(reporter);
