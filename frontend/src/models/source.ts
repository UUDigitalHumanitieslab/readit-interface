
import FancyModel from '../core/fancy-model';

import Author from './author';
import Fragment from './fragment';

export default class Source extends FancyModel {
    id: number
    name: string
    author: Author
    publicationDate: string
    link: string
    fragments: Fragment[]
}
