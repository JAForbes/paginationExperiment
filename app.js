window.Backbone = require('backbone')
window.PageableCollection = require('backbone.paginator')
window._ = require('lodash')
window.R = require('ramda')
window.Promise = require('promise')
window.request = Promise.denodeify(require('browser-request'))

request({
  url: 'https://api.dphoto.com/auths',
  headers: {
    'API-Version': '2.0',
  },
  method: "POST",
  json: true,
  //convert the url params into a hash
  body:  R.pipe(
    R.skip(1),
    R.join(''),
    R.split('&'),
    R.map(R.split('=')),
    R.fromPairs
  )(window.location.search)
})
.then(R.path('body.result.auth_token'))
.then(logged_in);


console.log("Reload the page with the following query params in the URL, auth_domain, auth_password, app_key, auth_type")

function logged_in(auth_token){
  console.log(auth_token)

  var date_after = 1414254948;
  var date_before = 1416488746;
  var limit = 5;
  request({ url: 'https://api.dphoto.com/files?limit='+limit+'&date_after='+date_after+'&date_before='+date_before, headers: { 'API-Version': '2.0', 'Auth-Token': auth_token }, json: true})
  .then(R.path('body.result'))
  .then(R.map(function(file){
    console.log(file.file_created >= date_after, file.file_created <= date_before);
  }))
}
