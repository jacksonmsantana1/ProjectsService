const Joi = require('joi');
const schema = require('../Project/ProjectModel');

const map = require('ramda').map;
const isEmpty = require('ramda').isEmpty;
const isNil = require('ramda').isNil;
const curry = require('ramda').curry;
const nth = require('ramda').nth;

// _find :: Database -> Number -> Promise(Cursor)
const _find = curry((db, n) => Promise.resolve(db.find({}).limit(n).toArray()));

// _findById :: Database -> String -> Promise(Cursor)
const _findById = curry((db, _id) => Promise.resolve(db.find({ id: _id }).toArray()));

// validateCallback :: (Error, Project) -> Promise(Error, Project)
const validateCallback = (err, project) =>
  new Promise((resolve, reject) => {
    if (!!err) {
      reject(new Error('MongoDB Error => Invalid Project'));
    }

    resolve(project);
  });

// validateSchema :: Project -> Promise(Error, Project)
const validateSchema = (project) => Joi.validate(project, schema, validateCallback);

// validate :: [Projects] -> Promise(Error, [Projects])
const validate = (projects) => Promise.all(map(validateSchema, projects));

// isZeroProjects :: [Project] -> Promise(Error, [Project])
const isZeroProjects = (projects) => {
  if (isEmpty(projects || isNil(projects))) {
    return Promise.reject(new Error('MongoDB ERROR => No projects found'));
  }

  return Promise.resolve(projects);
};

// validateOneProject :: Project -> Promise(Error, Project)
const validateOneProject = (project) => {
  if (isNil(project) || isEmpty(project)) {
    return Promise.reject(new Error('MongoDB ERROR => Inexistent Project'));
  }

  return Promise.resolve(project);
};

// _getProjects :: Database:db -> Number:limit -> Promise(Error, [Projects])
const _getProjects = curry((db, limit) =>
  new Promise((resolve, reject) => {
    if (isNaN(limit) || isEmpty(limit) || isNil(limit)) {
      reject(new Error('MongoDB ERROR => Invalid Attribute'));
    } else if (isNil(db) || isEmpty(db)) {
      reject(new Error('MongoDB ERROR => Inexistent DB'));
    }

    _find(db, limit)
      .then(validate)
      .then(isZeroProjects)
      .then(resolve)
      .catch(reject);
  }));

// _getProjectById :: Database:db -> String:id -> Promise(Error, Project)
const _getProjectById = curry((db, id) =>
  new Promise((resolve, reject) => {
    if (isEmpty(id) || isNil(id)) {
      reject(new Error('MongoDB ERROR => Invalid Attribute'));
    } else if (isNil(db) || isEmpty(db)) {
      reject(new Error('MongoDB ERROR => Inexistent DB'));
    }

    _findById(db, id)
      .then(nth(0))
      .then(validateOneProject)
      .then(validateSchema)
      .then(resolve)
      .catch(reject);
  }));

// _addLikes :: Database:db -> String:userId -> Promise(Error, Project)
const _addLikes = curry((db, projectId, userId) =>
  new Promise((resolve, reject) => {
    if (isEmpty(userId) || isNil(userId)) {
      reject(new Error('MongoDB ERROR => Invalid Attribute:userId'));
    } else if (isNil(db) || isEmpty(db)) {
      reject(new Error('MongoDB ERROR => Inexistent DB'));
    } else if (isNil(projectId) || isEmpty(projectId)) {
      reject(new Error('MongoDB ERROR => Invalid Attribute:projectId'));
    }

    db.update({ id: projectId }, { $addToSet: { liked: userId } })
      .then((writeResult) => {
        if (!writeResult.result.n) {
          reject(new Error('MongoDB ERROR => Inexistent Project'));
        } else if (!!writeResult.result.nModified && !!writeResult.result.n) {
          resolve(true);
        } else if (!writeResult.result.nModified && !!writeResult.result.n) {
          reject(new Error('Project already liked'));
        }
      }).catch(reject);
  }));

// _removeLikes :: Database:db -> String:projectId -> String:userId -> Promise(Error, Project)
const _removeLikes = curry((db, projectId, userId) =>
  new Promise((resolve, reject) => {
    if (isEmpty(userId) || isNil(userId)) {
      reject(new Error('MongoDB ERROR => Invalid Attribute:userId'));
    } else if (isNil(db) || isEmpty(db)) {
      reject(new Error('MongoDB ERROR => Inexistent DB'));
    } else if (isNil(projectId) || isEmpty(projectId)) {
      reject(new Error('MongoDB ERROR => Invalid Attribute:projectId'));
    }

    db.update({ id: projectId }, { $pull: { liked: userId } })
      .then((writeResult) => {
        if (!writeResult.result.n) {
          reject(new Error('MongoDB ERROR => Inexistent Project'));
        } else if (!writeResult.result.nModified && !!writeResult.result.n) {
          reject(new Error('Already removed the like'));
        } else if (!!writeResult.result.nModified && !!writeResult.result.n) {
          resolve(true);
        } else if (!writeResult.ok) {
          reject(new Error('MongoDB Server Error'));
        }
      });
  }));

// _addPins :: Database:db -> String:projectId -> String:userId -> Promise
const _addPins = curry((db, projectId, userId) =>
  new Promise((resolve, reject) => {
    if (isNil(db) || isEmpty(db)) {
      reject(new Error('MongoDB ERROR => Inexistent DB'));
    } else if (isNil(projectId) || isEmpty(projectId)) {
      reject(new Error('MongoDB ERROR => Invalid Attribute:projectId'));
    } else if (isNil(userId) || isEmpty(userId)) {
      reject(new Error('MongoDB ERROR => Invalid Attribute:userId'));
    }

    db.update({ id: projectId }, { $addToSet: { pinned: userId } })
      .then((writeResult) => {
        if (!writeResult.result.n) {
          reject(new Error('MongoDB ERROR => Inexistent Project'));
        } else if (!!writeResult.result.nModified && !!writeResult.result.n) {
          resolve(true);
        } else if (!writeResult.result.nModified && !!writeResult.result.n) {
          reject(new Error('Project already pinned'));
        }
      }).catch(reject);
  }));

// _removePins :: Database:db -> String:projectId -> String:userId -> Promise(Error, Project)
const _removePins = curry((db, projectId, userId) =>
  new Promise((resolve, reject) => {
    if (isEmpty(userId) || isNil(userId)) {
      reject(new Error('MongoDB ERROR => Invalid Attribute:userId'));
    } else if (isNil(db) || isEmpty(db)) {
      reject(new Error('MongoDB ERROR => Inexistent DB'));
    } else if (isNil(projectId) || isEmpty(projectId)) {
      reject(new Error('MongoDB ERROR => Invalid Attribute:projectId'));
    }

    db.update({ id: projectId }, { $pull: { pinned: userId } })
      .then((writeResult) => {
        if (!writeResult.result.n) {
          reject(new Error('MongoDB ERROR => Inexistent Project'));
        } else if (!writeResult.result.nModified && !!writeResult.result.n) {
          reject(new Error('Already removed the pin'));
        } else if (!!writeResult.result.nModified && !!writeResult.result.n) {
          resolve(true);
        } else if (!writeResult.ok) {
          reject(new Error('MongoDB Server Error'));
        }
      });
  }));

module.exports = {
  getProjects: _getProjects,
  getProjectById: _getProjectById,
  addLikes: _addLikes,
  removeLikes: _removeLikes,
  addPins: _addPins,
  removePins: _removePins,
};
