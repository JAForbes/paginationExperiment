Backbone = require('backbone')
Backbone.$ = require('jquery');

_ = require('lodash')
R = require('ramda')
//convert the url params into a hash
hashFromParams = require('./hashFromParams')

authedSync = _.curry(function(Backbone_sync,auth_tokem,method,model,options){
  options.headers = { 'API-Version': '2.0', 'Auth-Token': auth_token };
  return Backbone_sync(method,model,options);
})

//asynchronous logging
tap = require('./tap')
log = tap(console.log.bind(console))

Backbone.ajax('https://api.dphoto.com/auths/',{
  method: 'POST',
  data: hashFromParams(window.location.search),
  dataType: "json"
})
.then(R.path('result.auth_token'))
.then( log('Auth Token retrieved: ') )
.then(authedSync(Backbone.sync))
.then(function(authedSync){
  Backbone.sync = authedSync;
})
