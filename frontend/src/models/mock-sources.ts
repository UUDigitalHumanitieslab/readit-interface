var mockSources = [
    {
        id: 40000,
        name: 'The Idler in France (id_19_c, p.295) / by the countess of Blessington',
        author: 'Blessington, Margaret Gardiner',
        publicationDate: '1841-01-01',
        text: 'I walked with Comte d\'O-- this evening into the Champs-Elysees, and great was the change effected \
        there within the last few days. It looks ruined and desolate, the ground cut up by the pieces of cannon, and \
        troops as well as the mobs that have made it a thoroughfare, and many of the trees greatly injured, if not destroyed. \
        A crowd was assembled around a man who was reading aloud for their edification a proclamation nailed to one of \
        the trees. We paused for a moment to hear it, when some of the persons recognising my companion, shouted aloud, \
        "Vive le Comte d\'Orsay! Vive le Comte d\'Orsay" and the cry being taken up by the mass, the reader was deserted, \
        the fickle multitude directing all their attention and enthusiasm to the new comer. We had some diffculty in \
        escaping from these troublesome and unexpected demonstrations of good will; and, while hurrying from the scene of \
        this impromptu ovation to the unsought popularity of my companion, I made him smile by hinting at the danger in \
        which he stood of being raised to the vacant throne by those who seem not to know or care who is to till it.',
        annotations: []
    },
    {
        id: 40001,
        name: 'The Idler in France (id_19_c, p.190) / by the countess of Blessington',
        author: 'Blessington, Margaret Gardiner',
        publicationDate: '1841-01-01',
        text: 'I have been reading some French poems by Madame Amabel Tastu; \
        and very beautiful they are. A sweet and healthy tone of mind breathes \
        through them, and the pensiveness that characterises many of them, \
        marks a reecting spirit imbued with tenderness. There is great harmony, \
        too, in the versication, as well as purity and elegance in the diction. How \
        much some works make us wish to know their authors, and vice versa ! I \
        feel, while reading her poems, that I should like Madame Amabel Tastu; \
        while other books, whose cleverness I admit, convince me I should not \
        like the writers.',
        annotations: []
    },
    {
        id: 40002,
        name: 'The Idler in France (id_19_c, p.40) / by the countess of Blessington',
        author: 'Blessington, Margaret Gardiner',
        publicationDate: '1841-01-01',
        text: 'I remember reading years ago of the melancholy physiognomy of King \
        Charles I, which when seen in his portrait by a Florentine sculptor, to \
        whom it was sent in order that a bust should be made from it, drew forth\
        the observation that the countenance indicated that its owner would come\
        to a violent death.\
        I was reminded of this anecdote by the face of the Duchesse d\'Angoulême;\
        for though I do not pretend to a prescience as to her future fate, I cannot\
        help arguing from it that, even should a peaceful reign await her, the\
        fearful trials of her youth have destroyed in her the power of enjoyment;\
        and that on a throne she can never forget the father and mother she saw\
        hurried from it, to meet every insult that malice could invent, or cruelty\
        could devise, before a violent death freed them from their sufferings.',
        annotations: []
    },
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