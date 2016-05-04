//MOCKING
const _isValid = (id) =>
  new Promise((resolve, reject) => {
    if (id === 'DontExist') {
      reject(false);
    }

    resolve(true);
  });

module.exports = {
  isValid: _isValid,
};
