import * as Reporter from 'jasmine-terminal-reporter';

const env = jasmine.getEnv();
const reporter = new Reporter({
    print: console.log,
});

env.addReporter(reporter);
