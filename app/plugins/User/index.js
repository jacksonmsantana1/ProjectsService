const Boom = require('boom');
const Wreck = require('wreck');
const ProjectUrl = 'http://localhost:3000/user/';

const _isValid = (id, options, fn) =>
  Wreck.get(ProjectUrl + id + '/isValid', options, fn);

const _isAdmin = (id, options, fn) =>
  Wreck.get(ProjectUrl + id + '/isAdmin', options, fn);
const options = {
  headers: {
    authorization: require('../../../admin'),
  },
  json: true,
};

module.exports = {
  isValid: (id) =>
    new Promise((resolve, reject) =>
      _isValid(id, options, (err, res, payload) => {
        if (err) {
          reject(Boom.badGateway(err.message));
        }

        if (!payload && res.statusCode === 200) {
          resolve(false);
        } else if (payload && res.statusCode === 200) {
          resolve(true);
        }
      })),
  isAdmin: (id) =>
    new Promise((resolve, reject) =>
      _isAdmin(id, options, (err, res, payload) => {
        if (err) {
          reject(Boom.badGateway(err.message));
        }

        if (res.statusCode === 401 && payload.message === 'Inexistent User') {
          reject(payload);
        }

        if (!payload && res.statusCode === 200) {
          resolve(false);
        } else if (payload && res.statusCode === 200) {
          resolve(true);
        }
      })),
};
