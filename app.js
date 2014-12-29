window.Backbone = require('backbone')
Backbone.$ = require('jquery');

window._ = require('lodash')
window.R = require('ramda')

dphoto = {};
dphoto.Files = Backbone.Collection.extend({

  url: 'https://api.dphoto.com/files',

  //Pagination ajax settings passed to fetch
  pagination: {
    data:{
      offset: 0,
      limit: 100
    },
    reset: true
  },

  hasNext: true,
  hasPrev: false,

  parse: R.get('result'),

  throwFetchError: function(direction){
    throw "Attempted to fetch"+direction+"Page when has"+direction+" was false."
  },

  fetchPrevPage: function(){
    if(files.hasPrev){
      //todo clone, and set to pagination data if result.length > 0
      this.pagination.data.offset-=this.pagination.data.limit;
      return this.fetchPage(this.pagination)
    } else {
      this.throwFetchError('Prev')
    }
  },

  fetchNextPage: function(){
    if(files.hasNext){
      //todo clone, and set to pagination data if result.length > 0
      this.pagination.data.offset+=this.pagination.data.limit;
      return this.fetchPage(this.pagination)
    } else {
      this.throwFetchError('Next')
    }
  },

  onFetchPage: function(response){

    this.hasPrev = this.pagination.data.offset > 0
    var forwardPageHadResult = !!response.result.length;
    var backwardPageToFirstOrLower = this.pagination.data.offset < 1;

    this.hasNext = backwardPageToFirstOrLower || forwardPageHadResult
  },

  fetchPage: function(options){
    return this.fetch(options)
      .then(this.onFetchPage.bind(this))
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
