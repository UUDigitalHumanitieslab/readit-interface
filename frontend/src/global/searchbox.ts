import SearchboxView from '../search/search-box/searchbox-view';

const exampleQueryFields = [
    {
        'label': 'all fields',
        'value': 'all'
    },
    {
        'label': 'source title',
        'value': 'title'
    },
    {
        'label': 'source author',
        'value': 'author'
    },
    // removing annotations option for now, as it's not currently supported
    // {
    //     'label': 'annotations',
    //     'value': 'snippet_text'
    // },
    {
        'label': 'full text',
        'value': 'text*'
    },
];

export default new SearchboxView(exampleQueryFields);
