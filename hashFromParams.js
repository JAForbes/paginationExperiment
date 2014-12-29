var R = require('ramda')

module.exports = R.pipe(
  R.substringFrom(1),
  R.split('&'),
  R.map(R.split('=')),
  R.fromPairs
)
