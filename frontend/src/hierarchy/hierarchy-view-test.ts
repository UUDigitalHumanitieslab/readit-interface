import { each } from 'lodash';

import Model from '../core/model';
import Collection from '../core/collection';
import View from '../core/view';

import viewHierarchy, { HierarchyView } from './hierarchy-view';

const exampleHierarchy = new Model({
    model: new Model({ id: 1 }),
    collection: new Collection([{
        // A relatively "normal" subhierarchy
        model: new Model({ id: 2 }),
        collection: new Collection([{
            model: new Model({ id: 3 }),
            collection: new Collection([{
                model: new Model({ id: 4 }),
            }]),
        }, {
            model: new Model({ id: 5 }),
            collection: new Collection(),
        }]),
    }, {
        // A deeply nested subhierarchy
        model: new Model({ id: 6 }),
        collection: new Collection([{
            model: new Model({ id: 7 }),
            collection: new Collection([{
                model: new Model({ id: 8 }),
                collection: new Collection([{
                    model: new Model({ id: 9 }),
                    collection: new Collection(),
                }]),
            }]),
        }]),
    }, {
        // One branch without model and one without collection
        model: new Model({ id: 10 }),
        collection: new Collection([{
            model: new Model({ id: 11 }),
        }, {
            collection: new Collection([{
                model: new Model({ id: 12 }),
            }, {
                model: new Model({ id: 13 }),
            }]),
        }]),
    }]),
});

class ExampleTerminalView extends View {
    initialize(): void {
        this.render();
    }
    render(): this {
        this.$el.attr('id', this.model.id);
        return this;
    }
}

function trivialMakeItem(model: Model): ExampleTerminalView {
    return new ExampleTerminalView({ model });
}

const expectedTrivialHtml = `
<div>
    <div id="1"></div>
    <div>
        <div>
            <div id="2"></div>
            <div>
                <div>
                    <div id="3"></div>
                    <div>
                        <div>
                            <div id="4"></div>
                        </div>
                    </div>
                </div>
                <div>
                    <div id="5"></div>
                    <div></div>
                </div>
            </div>
        </div>
        <div>
            <div id="6"></div>
            <div>
                <div>
                    <div id="7"></div>
                    <div>
                        <div>
                            <div id="8"></div>
                            <div>
                                <div>
                                    <div id="9"></div>
                                    <div></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div>
            <div id="10"></div>
            <div>
                <div>
                    <div id="11"></div>
                </div>
                <div>
                    <div>
                        <div>
                            <div id="12"></div>
                        </div>
                        <div>
                            <div id="13"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
`.replace(/$\s*/mg, '');

describe('viewHierarchy', function() {
    it('constructs a view hierarchy with terminal views of choice', function() {
        const view = viewHierarchy({
            model: exampleHierarchy,
            makeItem: trivialMakeItem,
        });
        expect(view.el.outerHTML).toBe(expectedTrivialHtml);
    });

    it('can render a collection directly', function() {
        const view = viewHierarchy({
            collection: exampleHierarchy.get('collection'),
            makeItem: trivialMakeItem,
        });
        expect(view.el.outerHTML).toBe(expectedTrivialHtml.slice(23, -6));
    });

    it('can target options specifically to the wrapper views', function() {
        const view = viewHierarchy({
            model: exampleHierarchy,
            makeItem: trivialMakeItem,
            compositeOptions: { tagName: 'article' },
            collectionOptions: { tagName: 'section' },
        });
        const html = view.el.outerHTML;
        each({
            // Two hits for each element: opening tag and closing tag.
            article: 28,
            section: 20,
            div: 26,
        }, (count, elementName) => {
            expect(Array.from(html.matchAll(new RegExp(elementName))).length).toBe(count);
        });
    });

    it('can hack the hierarchy through the makeItem this binding', function() {
        const spy = jasmine.createSpy();
        function fancyMakeItem(model: Model) {
            if (model.id === 7) spy(this);
            return trivialMakeItem(model);
        }
        const view = viewHierarchy({
            model: exampleHierarchy,
            makeItem: fancyMakeItem,
        }) as HierarchyView;
        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledWith(
            (
                view.collectionView.items[1] as HierarchyView
            ).collectionView.items[0]
        );
    });
});
