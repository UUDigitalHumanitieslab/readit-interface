import { extend } from 'lodash';
import Collection from '../core/collection';
import * as _ from 'underscore';

import Source from './source';
import Fragment from './fragment';
import Snippet from './snippet';

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
        var snippets = []

        for (let source of sources) {
            for (let fragment of source.fragments) {

            }
            
            
            for (let snippet of source.snippets) {
                var s = {
                    'text': snippet.text,
                    'tags': this.extractTypes(snippet),
                    'source': source
                }
                snippets.push(s);
            }
        }

        return new FragmentCollection(snippets);
    }

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