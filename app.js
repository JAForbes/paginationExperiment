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

  hasNext: true,
  hasPrev: false,

  parse: R.get('result'),

  fetchPrevPage: function(){
    this.pagination.offset-=this.pagination.limit;
    return this.fetchPage(this.pagination)
  },

  fetchNextPage: function(){
    this.pagination.offset+=this.pagination.limit;
    return this.fetchPage(this.pagination)
  },

  onFetchPage: function(response){

    this.hasPrev = this.pagination.offset > 0
    var forwardPageHadResult = !!response.result.length;
    var backwardPageToFirstOrLower = this.pagination.offset < 1;

    this.hasNext = backwardPageToFirstOrLower || forwardPageHadResult
  },

  fetchPage: function(options){
    return this.fetch({data: options}).then(this.onFetchPage.bind(this))
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
