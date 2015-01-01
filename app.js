var Backbone = require('backbone')
    Backbone.$ = require('jquery')

var _ = require('lodash')
    window._ = _
    
var R = require('ramda')

//convert the url params into a hash
var hashFromParams = require('./hashFromParams')

var PaginatedCollection = require('./collections/paginatedView')
var GridView = require('./views/grid')
var ControlView = require('./views/controls')
var File = Backbone.Model.extend({
  idAttribute: 'file_id'
})
var Files = PaginatedCollection.extend({
  url: 'https://api.dphoto.com/files',
  model: File,
  parse: R.get('result')
})

var CreateAuthedSync = _.curry(function(Backbone_sync,auth_token,method,model,options){
  options.headers = { 'API-Version': '2.0', 'Auth-Token': auth_token };
  return Backbone_sync(method,model,options);
})

//asynchronous logging
var tap = require('./tap')
var log = tap(console.log.bind(console))

Backbone.ajax('https://api.dphoto.com/auths/',{
  method: 'POST',
  data: hashFromParams(window.location.search),
  dataType: "json"
})
.then(R.path('result.auth_token'))
.then( log('Auth Token retrieved: ') )
.then(CreateAuthedSync(Backbone.sync))
.then(function(authedSync){
  Backbone.sync = authedSync;
})
.then(function(){
  grid = new GridView({ collection: new Files() })
  grid.collection.pagination.settings.sync.data.type = 'F'

  controlsView = new ControlView({
    collection: grid.collection,
    el: controls
  })

  content.appendChild(grid.el)

  grid.collection.fetchCurrentPage()
})
