var curry = require('lodash').curry

module.exports = curry(function(func){
  var rest = Array.prototype.slice.call(arguments,1);
  func.apply(this,rest);
  return rest.slice(-1)[0]
},3)
