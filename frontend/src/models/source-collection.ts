import { extend } from 'lodash';
import Collection from '../core/collection';

import Source from './source';

export default class SourceCollection extends Collection {
    
}

extend (SourceCollection.prototype, {
    model: Source,
    fetch: function (options: any) {        
        let sources = this.getMockData();
        this.set(new SourceCollection(sources))
        options.success(new SourceCollection(sources), {}, {});
    }
})