import FancyModel from '../core/fancy-model';

import Snippet from './snippet'
import Item from './item';

export default class Fragment extends FancyModel {
    id: number
    text: string
    snippets: Snippet[]    
}