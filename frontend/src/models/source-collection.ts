import { extend } from 'lodash';
import Collection from '../core/collection';

import Source from './source';
import mockSources from './mock-sources';

export default class SourceCollection extends Collection {
    getMockData() {
        var sources: Source[] = [];
        
        for (let source of (mockSources)) {
            sources.push(new Source(source));
        }

        return new SourceCollection(sources);
    }
}

extend (SourceCollection.prototype, {
    model: Source,
    fetch: function (options: any) {
        let sources = this.getMockData();
        this.set(sources.models)
        options.success(this, {}, {});
    }
})