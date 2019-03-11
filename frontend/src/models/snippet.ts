import FancyModel from '../core/fancy-model';
import Item from './item';
import ItemLink from './itemLink';

export default class Snippet extends FancyModel {

    // constructor(selection: Selection) {
        
    // }

    rect: any;
    range: Range;

    id: number;
    text: string;
    startIndex: number;
    endIndex: number;
    items: Item[];
    links: ItemLink[];
}