import UploadSourceView from './upload-source-view';

const escapeThisText = '<script>With malicious intent</script>';

describe('UploadSourceView', function() {
    beforeEach(function() {
        this.view = new UploadSourceView().render();
    });

    it('can be constructed in isolation', function() {
        expect(this.view.$el.html()).toBeTruthy();
    });

    it('escapes html', function() {
        expect(this.view.escapeHtml(escapeThisText)).toEqual('&lt;script&gt;With malicious intent&lt;/script&gt;');
    });
});
