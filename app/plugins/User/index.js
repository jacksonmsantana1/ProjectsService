//MOCKING
const _isValid = (id) =>
  new Promise((resolve, reject) => {
    if (id === 'DontExist') {
      resolve(false);
    } else if (id === 'Server Communication Error') {
      reject('Server Communication Error');
    }

    resolve(true);
  });

module.exports = {
  isValid: _isValid,
};
