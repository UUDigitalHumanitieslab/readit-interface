import { extend } from 'lodash';
import Collection from '../core/collection';
import * as _ from 'underscore';

import Source from './source';
import Fragment from './fragment';

import mockSources from './mock-sources';


export default class FragmentCollection extends Collection {
    getMockData() {
        var sources: Source[] = [];
        
        for (let source of (mockSources)) {
            sources.push(new Source(source));
        }

        return this.convertToFragments(sources);
    }

    convertToFragments(sources: Source[]) {
        var fragments = []

        for (let source of sources) {
            for (let fragment of source.attributes.fragments) {
                fragments.push(fragment)
            }
        }

        return new FragmentCollection(fragments);
    }

    // var s = {
    //     'text': snippet.text,
    //     'tags': this.extractTypes(snippet),
    //     'source': source
    // }
    // snippets.push(s);

    extractTypes(snippet: any): any[] {
        return _.map(snippet.entities, (entity) => {
            return {
                'id': entity.category.id,
                'name': entity.category.name,
                'className': entity.category.name.replace(/ /g, ""),
            }
        })
    }
}

extend(FragmentCollection.prototype, {
    model: Fragment,
    fetch: function (options: any) {
        let sources = this.getMockData();
        this.set(sources.models)
        options.success(this, {}, {});
    }
})