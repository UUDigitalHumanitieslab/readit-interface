var mockSources = [{
    id: 40000,
    name: 'SourceUsedInPrague',
    author: {
        name: 'Shelley Trower',
        id: 20,
        someExternalId: 12345,
    },
    publicationDate: '13 november 2014',
    link: 'static/sources/source1.pdf',
    fragments: [
        {
            id: 50005,
            text: 'Name of Interviewee: Ferelith Hordon; Name of Interviewer: Shelley Trower; Date of Interview: 13th November 2014. It wasn’t just the story, he was drawing on all sorts of other ideas and associations, which you might not have recognised at the time, but it was there as a very rich, a richness to the story that excited one and made one feel, ooh, there are more things to explore, and I think one found that throughout the whole of that sequence, The Voyage of the Dawn Treader, to discover that John Mandeville had written that this was the, the, later, to discover that these were stories that people in the Middle Ages, he was playing around with stories that already existed.',
            snippets: [
                {
                    id: 10001,
                    text: 'Ferelith Hordon',
                    items: [
                        {
                            category: {
                                id: 1,
                                name: 'reader',
                            }
                        },
                        {
                            category: {
                                id: 4,
                                name: 'person',
                                attributes: [
                                    {
                                        id: 20003,
                                        name: 'birth name',
                                        value: 'Ferelith Hordon',
                                    },
                                    {
                                        id: 20004,
                                        name: 'gender',
                                        value: 'female',
                                    }
                                ],
                            }
                        }],
                },
                {
                    id: 10001,
                    text: 'The Voyage of the Dawn Treader',
                    items: [
                        {
                            category: {
                                id: 2,
                                name: 'content',
                            }
                        },
                    ],
                },
                {
                    id: 10002,
                    text: 'a richness to the story that excited one',
                    items: [
                        {
                            category: {
                                id: 3,
                                name: 'state of mind',
                                attributes: [
                                    {
                                        id: 20002,
                                        name: 'emotion',
                                        value: 'excitement',
                                    }
                                ],
                            }
                        },
                    ],
                },
                {
                    id: 10003,
                    text: 'John Mandeville',
                    items: [
                        {
                            category: {
                                id: 4,
                                name: 'person',
                                attributes: [
                                    {
                                        id: 20003,
                                        name: 'birth name',
                                        value: 'John Mandeville',
                                    },
                                    {
                                        id: 20004,
                                        name: 'gender',
                                        value: 'male',
                                    }
                                ],
                            }
                        },
                    ],
                }
            ],
        }
    ],
},
{
    id: 40001,
    name: 'Extract from Memories of fiction',
    author: {
        name: 'Ferelith H',
        id: 21,
        someExternalId: 12346,
    },
    date: '2014',
    link: 'https://soundcloud.com/memoriesoffiction/ferelith-part-2',
    fragments: [
        {
            id: 50001,
            text: 'But, ah, everything seems to either be at the age of eight or the age of twelve, but I’m pretty certain it would have been about twelve because I read Jane Eyre on the train coming back from staying with my godmother in, just outside Oxford, and I remember it was my mother’s two volume edition and we’d covered it in brown paper, and I think she’d covered it in brown paper really to sort of make me feel better about reading rather, what seemed to me rather an old fashioned book. It didn’t have a cover with pictures on it. It was bound, I think in, white vellum or so, it was, but it was a particular edition, and I remember, I just was swallowed up by it. I, I still remember the red room, just the, the fact, and the first meeting with Rochester, who, despite all the feminist arguments, and yes, I can well, I can see exactly how the, that the viewpoints, but one did fall in love with Rochester [laughter]. Why, why, I don’t know, but, but one did. But did you identify with Jane Eyre? You’ve been saying you didn’t really identify particularly with the characters in, ah, The Lion, the Witch and the Wardrobe, was Jane Eyre, do you think, more of an identifiable character? Yes, yes, to a certain extent, I think, but I liked her and I, I, I wanted to follow her on her journey and on her adventure. I don’t, no, I don’t think I saw her as me. I mean, I, she, but I, perhaps something, aspects that I would like to be that I, I did find her, I don’t think I’ve ever really been the characters.',
            snippets: [
                {
                    id: 10010,
                    text: 'Ferelith H',
                    items: [
                        {
                            category: {
                                id: 1,
                                name: 'reader',
                                attributes: [
                                    {
                                        id: 20005,
                                        name: 'age',
                                        value: 12,
                                    },
                                ],
                            }
                        },
                        {
                            category: {
                                id: 4,
                                name: 'person',
                                attributes: [
                                    {
                                        id: 20003,
                                        name: 'birth name',
                                        value: 'Ferelith Hordon',
                                    },
                                    {
                                        id: 20004,
                                        name: 'gender',
                                        value: 'female',
                                    }
                                ],
                            }
                        }],
                },
                {
                    id: 10011,
                    text: 'Jane Eyre',
                    items: [
                        {
                            category: {
                                id: 2,
                                name: 'content',
                            }
                        }
                    ]

                },
                {
                    id: 10012,
                    text: 'Jane Eyre',
                    items: [
                        {
                            category: {
                                id: 13,
                                name: 'support',
                            }
                        },
                    ]
                },
                {
                    id: 10013,
                    text: 'covered it in brown paper',
                    items: [
                        {
                            category: {
                                id: 10,
                                name: 'alteration',
                            }
                        },
                    ],
                    links: [
                        {
                            entityLink: {
                                id: 30003,
                                type: 'alteringA',
                                to: 10012
                            }
                        },
                    ]
                },
                {
                    id: 10014,
                    text: 'on the train coming back from staying with my godmother',
                    items: [
                        {
                            category: {
                                id: 11,
                                name: 'event',
                                attributes: [
                                    {
                                        id: 20005,
                                        name: 'place',
                                        value: 'on the train',
                                    }
                                ],
                            }
                        },
                    ],
                },
                {
                    id: 10015,
                    text: 'make me feel better about reading',
                    items: [
                        {
                            category: {
                                id: 3,
                                name: 'state of mind',
                                attributes: [
                                    {
                                        id: 20005,
                                        name: 'aim',
                                        value: '?',
                                    },
                                ],
                            }
                        },
                    ],
                },
                {
                    id: 10016,
                    text: 'particular edition',
                    items: [
                        {
                            category: {
                                id: 10,
                                name: 'alteration',
                                attributes: [
                                    {
                                        id: 20006,
                                        name: 'remembrance',
                                        value: '?',
                                    }
                                ],
                            }
                        },
                    ],
                    links: [
                        {
                            entityLink: {
                                id: 30004,
                                type: 'alteringA',
                                to: 10012
                            }
                        },
                    ]
                },
                {
                    id: 10017,
                    text: 'I remember',
                    items: [
                        {
                            category: {
                                id: 3,
                                name: 'state of mind',
                                attributes: [
                                    {
                                        id: 20006,
                                        name: 'remembrance',
                                        value: '?',
                                    }
                                ],
                            }
                        },
                    ],
                },
            ],
        }
    ],

}]

export default mockSources;