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
          limit: 1
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

  initialize: function(){
    this.actualData = [];
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
    return ! (this.pagination.state.lastPageDirection == 'Next' && this.pagination.state.lastRequestSize == 0)

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

  _concatAt: function(at, target, concat){
    for( var i = 0; i < concat.length; i++){
      target[i+at] = concat[i]
    }
    return target;
  },

  _updateActualData: function(request,response){
    this._concatAt(request.data.offset, this.actualData, response.result)
    return response;
  },

  //fetch only if we don't have the values
  _fetchOr: function(options){
    var offset = options.data.offset
    var limit = options.data.limit
    var remaining = this.toJSON.apply(
      this.slice( offset, offset+limit)
    )
    var alreadyLoaded = remaining.length == limit
    if(alreadyLoaded){
      return Promise.resolve({
        result: remaining
      })
    } else {
      return this.fetch(options)
        .then(this._updateActualData.bind(this,options))
    }
  },

  _fetchPage: function(options){
    if(!this.pagination.state.pending){
      this.pagination.state.pending = true;
      options.at = options.data.offset
      return this._fetchOr(options)
        .then(this._updatePaginationStates.bind(this,options))
        .then(this._onFinishPageFetch.bind(this))
    } else {
      return Promise.reject("Already Pending a Request")
    }

  }
})
