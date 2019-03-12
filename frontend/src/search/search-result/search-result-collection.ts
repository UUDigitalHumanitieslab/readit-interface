import { extend } from 'lodash';
import Collection from '../../core/collection';
import * as _ from 'underscore';

import SearchResult from './search-result';
import Source from './../../models/source';
import SearchResultTag from './search-result-tag';
import mockSources from './../../models/mock-sources';

export default class SearchResultCollection extends Collection {
    getMockData(): SearchResultCollection {
        var sources: Source[] = [];
        
        for (let source of (mockSources)) {
            sources.push(new Source(source));
        }

        return this.convert(sources);
    }

    convert(sources: Source[]): SearchResultCollection {
        var results = []

        for (let source of sources) {
            for (let fragment of source.attributes.fragments) {
                let result = new SearchResult();
                result.fragment = fragment;
                if (result.fragment.text.length > 250) {
                    result.fragment.text_short = result.fragment.text.substr(0, 250) + "...";
                } else {
                    result.fragment.text_short = result.fragment.text;
                }
                result.source = source;
                
                let tags: SearchResultTag[] = []
                for (let snippet of fragment.snippets) {
                    for (let item of snippet.items) {
                        if (!tags.find(t => t.id === item.category.id)) {
                            tags.push(new SearchResultTag({
                                id: item.category.id,
                                name: item.category.name,
                                className: item.category.class,
                            }))
                        }
                    }
                }
                result.tags = tags;
                results.push(result)
            }
        }

        return new SearchResultCollection(results);
    }
}

extend(SearchResultCollection.prototype, {
    model: SearchResult,
    fetch: function (options: any) {
        let sources = this.getMockData();
        this.set(sources.models)
        options.success(this, {}, {});
    }
})