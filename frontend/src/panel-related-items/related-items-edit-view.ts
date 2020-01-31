import { extend } from 'lodash';

import Collection from '../core/collection';
import { CollectionView } from '../core/view';
import RelationEditor from './relation-editor-view';
import relatedItemsTemplate from './related-items-template';

export default class RelatedItemsEditor extends CollectionView {
    availablePredicates: Graph;
}
