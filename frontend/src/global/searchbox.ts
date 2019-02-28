import SearchboxView from '../search/search-box/searchbox-view';

let exampleQueryFields = [
    {
        'label': 'all fields',
        'value': 'all'
    },
    {
        'label': 'source title',
        'value': 'source_title'
    },
    {
        'label': 'source author',
        'value': 'source_author'
    },
    {
        'label': 'annotation',
        'value': 'snippet_text'
    },
    {
        'label': 'full text',
        'value': 'fragment_text'
    },
]

export default new SearchboxView(
    exampleQueryFields
)