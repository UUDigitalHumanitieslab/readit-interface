import Graph from './../jsonld/graph';
import Node from './../jsonld/node';
import flatData, {
    specificResource,
    contentClass,
    textQuoteSelector,
    textPositionSelector,
    annotationInstance,
} from './mock-expanded';

export default new Graph(flatData);

export function getSpecificResource(): Node {
    return new Node(specificResource);
}

export function getContent(): Node {
    return new Node(contentClass);
}

export function getTextQuoteSelector(): Node {
    return new Node(textQuoteSelector)
}

export function getTextPositionSelector(): Node {
    return new Node(textPositionSelector);
}

export function getAnnotation(): Node {
    return new Node(annotationInstance);
}
