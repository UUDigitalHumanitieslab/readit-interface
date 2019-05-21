import { extend } from 'lodash';
import View from '../../../core/view';

import SourceView from '../../../source/source-view';

export default class ExplorerView extends View {

    render(): View {
        this.setHeight();
        let sourceView = new SourceView();
        sourceView.render().$el.appendTo(this.$el);
        return this;
    }

    setHeight(): void {
        let vh = $(window).height();
        let height = vh - 242 > 555 ? vh - 242 : 555; // where 242 compensates for menu and footer
        this.$el.css('height', height);
    }
}
extend(ExplorerView.prototype, {
    tagName: 'div',
    className: 'explorer',
    events: {
    }
});
