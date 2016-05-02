module.exports = {
  test: {
    url: 'mongodb://127.0.0.1:27017/test',
    settings: {
      db: {
        nativeParser: false,
      },
    },
  },
  postman: {
    url: 'mongodb://postman:postman@ds011429.mlab.com:11429/projects',
    settings: {
      db: {
        nativeParser: false,
      },
    },
  },
};
