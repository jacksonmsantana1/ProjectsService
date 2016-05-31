const ObjectId = require('mongodb').ObjectID;

module.exports = [{
  _id: ObjectId(),
  id: '1',
  name: 'Project1',
  author: 'Project Author',
  type: 'Blankets',
  creationDate: '05-05-2016',
  lastUpdateDate: '05-05-2016',
  svgDescription: 'SVG',
  svgProject: 'SVG',
  images: {
    doneByUsers: [],
    doneByAuthor: [],
    templates: [],
  },
  liked: [
    {
      id: '12873621312h13',
      userId: '192837nx1p212234',
      date: '06-05-2016',
    },
  ],
  pinned: [],
}, {
  _id: ObjectId(),
  id: '2',
  name: 'Project2',
  author: 'Project Author',
  type: 'Blankets',
  creationDate: '05-05-2016',
  lastUpdateDate: '05-05-2016',
  svgDescription: 'SVG',
  svgProject: 'SVG',
  images: {
    doneByUsers: [],
    doneByAuthor: [],
    templates: [],
  },
  liked: [
    {
      id: '12873621312h13',
      userId: '192837nx1p212234',
      date: '06-05-2016',
    },
  ],
  pinned: [],
}, {
  _id: ObjectId(),
  id: 's2783js10293ns1zn302',
  name: 'Project Name',
  author: 'Project Author',
  type: 'Blankets',
  creationDate: '05-05-2016',
  lastUpdateDate: '05-05-2016',
  svgDescription: 'SVG',
  svgProject: 'SVG',
  images: {
    doneByUsers: [],
    doneByAuthor: [],
    templates: [],
  },
  liked: [
    {
      id: '12873621312h13',
      userId: '192837nx1p212234',
      date: '06-05-2016',
    },
  ],
  pinned: [],
}, /*Invlaid Projects*/ {
  _id: ObjectId(),
  id: '1',
  like: [],
}, {
  _id: ObjectId(),
  id: '2',
  like: [],
},
];
