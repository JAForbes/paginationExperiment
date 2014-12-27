window.Backbone = require('backbone')
window.PageableCollection = require('backbone.paginator')
window._ = require('lodash')
window.R = require('ramda')
window.Promise = require('promise')
window.request = Promise.denodeify(require('browser-request'))

ServerCollection = Backbone.Collection.extend({
  request: function(o){
    _.extend({ offset: 0, limit: 5 },o)
    return {
      meta: this.pagination(this.length,o.limit,o.offset),
      result: this.slice(o.offset,o.offset+o.limit)
    }
  },

  pagination: function(numberOfItems,limit,offset){
    var page_count = numberOfItems / limit
    var current_page = Math.floor(page_count * (offset / numberOfItems))
    var data = {
      current_page: current_page,
      page_count: page_count
    }
    var next = offset+limit;
    var prev = offset-limit;

    if(next < numberOfItems) data.next_offset = next;
    if(prev >= 0) data.prev_offset = prev;
    return data;
  }
})

log = function(){
  var messages = _.toArray(arguments);
  return function(value){
    console.log.apply(console,messages.concat([value]))
    return value;
  }
}

exposeAs = _.curry(function(name,value){
  window[name] = value;
  return value;
})

create = R.construct;

//convert the url params into a hash
hashFromParams = R.pipe(
  R.substringFrom(1),
  R.split('&'),
  R.map(R.split('=')),
  R.fromPairs
)

request({
  url: 'https://api.dphoto.com/auths',
  headers: {
    'API-Version': '2.0',
  },
  method: "POST",
  json: true,

  body: hashFromParams(window.location.search)
})
.then(R.path('body.result.auth_token'))
.then( log('Auth Token retrieved: ') )
.then(function(auth_token){
  return request({ url: 'https://api.dphoto.com/files', headers: { 'API-Version': '2.0', 'Auth-Token': auth_token }, json: true})
})
.then(R.path('body.result')) //files
.then( log('Files retrieved') )
.then(create(ServerCollection))
.then(exposeAs('server'))
.then( log('ServerCollection exposed as server') )
