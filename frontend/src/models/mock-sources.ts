var mockSources = [
    {
        id: 40000,
        name: 'My First Mock Source',
        author: {
            name: 'Shelley Trower',
            id: 20,
            someExternalId: 12345,
        },
        publicationDate: '08 april 2019',
        text: getMockSourceText(),
        annotations: [
            {
                id: 9000,
                startIndex: 200,
                endIndex: 216,
                creationDate: 'whenever',
                category: 'reader',
                class: 'rit-reader'
            },
            {
                id: 9001,
                startIndex: 300,
                endIndex: 375,
                creationDate: 'whenever',
                category: 'state_of_mind',
                class: 'rit-alteration'
            },
        ]
    },
    {
        id: 40001,
        name: 'My Second Mock Source',
        author: {
            name: 'My First Mock Author',
            id: 21,
            someExternalId: 22345,
        },
        publicationDate: '08 april 2019',
        text: getMockSourceText(),
        annotations: [
            {
                id: 9002,
                startIndex: 0,
                endIndex: 16,
                creationDate: 'whenever',
                category: 'reader',
                class: 'rit-content'
            },
            {
                id: 9003,
                startIndex: 425,
                endIndex: 455,
                creationDate: 'whenever',
                category: 'state_of_mind',
                class: 'rit-state_of_mind'
            },
        ]
    },
    {
        id: 40002,
        name: 'A Third Mock Source',
        author: {
            name: 'My Second Mock Author',
            id: 22,
            someExternalId: 23345,
        },
        publicationDate: '10 april 2019',
        text: getMockSourceText(),
    },
    {
        id: 40003,
        name: 'Beautiful Mock Source number four',
        author: {
            name: 'My Third Mock Author',
            id: 23,
            someExternalId: 23445,
        },
        publicationDate: '10 april 2019',
        text: getMockSourceText(),
        annotations: [
            {
                id: 9002,
                startIndex: 345,
                endIndex: 352,
                creationDate: 'whenever',
                category: 'reader',
                class: 'rit-alteration'
            },
            {
                id: 9003,
                startIndex: 425,
                endIndex: 455,
                creationDate: 'whenever',
                category: 'state_of_mind',
                class: 'rit-state_of_mind'
            },
        ]
    }
]

export default mockSources;

function getMockSourceText(): string {
    return "Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum \
    sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies \
    nec, pellentesque eu, pretium quis, sem. Nulla consequat massa quis enim. Donec pede justo, fringilla vel, \
    aliquet nec, vulputate eget, arcu. In enim justo, rhoncus ut, imperdiet a, venenatis vitae, justo. Nullam dictum \
    felis eu pede mollis pretium. Integer tincidunt. Cras dapibus. Vivamus elementum semper nisi. Aenean vulputate \
    eleifend tellus. Aenean leo ligula, porttitor eu, consequat vitae, eleifend ac, enim. Aliquam lorem ante, \
    dapibus in, viverra quis, feugiat a, tellus. Phasellus viverra nulla ut metus varius laoreet. Quisque rutrum. \
    Aenean imperdiet. Etiam ultricies nisi vel augue. Curabitur ullamcorper ultricies nisi. Nam eget dui."
}