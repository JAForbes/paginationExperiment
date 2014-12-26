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
    R.slice(1),
    R.split('&'),
    R.map(R.split('=')),
    _.zipObject
  )(window.location.search)
})
.then(R.path('resp.body.result.auth_token'))
.then(logged_in);


console.log("Reload the page with the following query params in the URL, auth_domain, auth_password, app_key, auth_type")

function logged_in(auth_token){
  console.log(auth_token)
}
