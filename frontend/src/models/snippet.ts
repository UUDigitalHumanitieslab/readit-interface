import FancyModel from '../core/fancy-model';
import Item from './item';
import ItemLink from './itemLink';

export default class Snippet extends FancyModel {
    id: number;
    text: string;
    items: Item[];
    links: ItemLink[];
}