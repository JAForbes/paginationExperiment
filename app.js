window.Backbone = require('backbone')
Backbone.$ = require('jquery');

window._ = require('lodash')
window.R = require('ramda')

dphoto = {};
dphoto.Files = Backbone.Collection.extend({

  url: 'https://api.dphoto.com/files',

  pagination: {
    offset: 0,
    limit: 100
  },

  parse: R.get('result'),

  fetchPrevPage: function(){
    pagination.offset+=pagination.limit;
    return fetchPage(this.pagination)
  },

  fetchNextPage: function(){
    pagination.offset-=pagination.limit;
    return fetchPage(this.pagination)
  },

  fetchPage: function(options){
    return this.fetch()
  }
})

log = function(){
  var messages = _.toArray(arguments);
  return function(value){
    console.log.apply(console,messages.concat([value]))
    return value;
  }
}

createAuthedSync = function(auth_token){
  var Backbone_sync = Backbone.sync;
  function AuthedSync(method,model,options){
    options.headers = { 'API-Version': '2.0', 'Auth-Token': auth_token };
    return Backbone_sync(method,model,options);
  }
  return AuthedSync
}

//convert the url params into a hash
hashFromParams = R.pipe(
  R.substringFrom(1),
  R.split('&'),
  R.map(R.split('=')),
  R.fromPairs
)

Backbone.ajax('https://api.dphoto.com/auths/',{
  method: 'POST',
  data: hashFromParams(window.location.search),
  dataType: "json"
})
.then(R.path('result.auth_token'))
.then( log('Auth Token retrieved: ') )
.then(createAuthedSync)
.then( log('Created pre authed Backbone.sync function:\n\n'))
.then(function(authedSync){
  Backbone.sync = authedSync;
})
