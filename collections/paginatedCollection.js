var Backbone = require('Backbone')
var _ = require('lodash')
var Promise = require('promise')

module.exports = Backbone.Collection.extend({

  //Pagination ajax settings passed to fetch
  pagination: {
    //Backbone sync settings e.g. collection.fetch(pagination.settings.sync)
    settings: {
      sync: {
        data:{
          offset: 0,
          limit: 100
        },
        remove: false
      },
    },

    state: {
      lastRequestSize: null,
      lastPageDirection: null,
      pending: false,
    }
  },

  fetchCurrent: function(){
    return this._fetchPage(this.pagination.settings.sync)
  },

  fetchPrevPage: function(){
    return this._fetchPageDirection('Prev');
  },

  fetchNextPage: function(){
    return this._fetchPageDirection('Next');
  },

  hasNext: function(){
    return this.pagination.state.lastPageDirection == 'Next' && this.pagination.state.lastRequestSize ||
      this.pagination.settings.sync.data.offset <= 0
  },

  hasPrev: function(){
    return this.pagination.settings.sync.data.offset > 0;
  },

  _updatePaginationStates: function(request,response){
    this.pagination.state.lastPageDirection = request.data.offset > this.pagination.settings.sync.data.offset ? 'Next' : 'Prev'
    this.pagination.state.lastRequestSize = response.result.length;
    this.pagination.settings.sync = request;
  },

  _onFinishPageFetch: function(){
    this.pagination.state.pending = false;
  },

  _throwFetchError: function(direction){
    throw "Attempted to fetch"+direction+"Page when has"+direction+"() returned false."
  },

  _fetchPageDirection: function(directionName){

    var direction = ({ Next: 1, Prev: -1})[directionName]

    if(this['has'+directionName]()){
      //clone, so if the settings are incorrect, we don't lose anything
      var paginationSync = _.cloneDeep(this.pagination.settings.sync)

      paginationSync.data.offset += paginationSync.data.limit * direction;
      return this._fetchPage(paginationSync)
    } else {
      this._throwFetchError(directionName)
    }
  },

  //fetch only if we don't have the values
  _fetchOr: function(options){
    var offset = options.data.offset
    var limit = options.data.limit
    var remaining = this.toJSON.apply(
      this.slice( offset, offset+limit)
    )
    if(remaining.length == limit){
      console.log('don\'t need to fetch',remaining.length)
      return Promise.resolve({
        result: remaining
      })
    } else {
      console.log('fetching','remaining',remaining.length,'offset - limit abs',Math.abs(offset-limit),limit,offset)
      return this.fetch(options)
    }
  },

  _fetchPage: function(options){
    this.pagination.state.pending = true;
    options.at = options.data.offset
    return this._fetchOr(options)
      .then(this._updatePaginationStates.bind(this,options))
      .then(this._onFinishPageFetch.bind(this))
  }
})
