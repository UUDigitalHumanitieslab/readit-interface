import FancyModel from '../../core/fancy-model';

import Fragment from '../../models/fragment';
import Source from '../../models/source';
import SearchResultTag from './search-result-tag';

export default class SearchResult extends FancyModel {
    fragment: Fragment;
    source: Source;
    tags: SearchResultTag[];
}