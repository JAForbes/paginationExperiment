var Backbone = require('Backbone')
var _ = require('lodash')
var Promise = require('promise')

/*
  Problems

  Get _fetchPage to only request what we don't have. e.g. 99 items instead of 100

*/

module.exports = Backbone.Collection.extend({

  //Pagination ajax settings passed to fetch
  pagination: {
    //Backbone sync settings e.g. collection.fetch(pagination.settings.sync)
    settings: {
      sync: {
        data:{
          offset: 0,
          limit: 50
        },
        remove: false
      },
      overlap: 0.5,

      buffer: {
        boundary: [Infinity, 0],
        size: 200,
        minimumDisplacement: 50,
      }
    },

    state: {
      lastRequestSize: null,
      lastPageDirection: null,
      pending: false,
    }
  },

  initialize: function(options){
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
    return response
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

      paginationSync.data.offset += Math.floor(paginationSync.data.limit * direction * this.pagination.settings.overlap);
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

  _isInitialDataSetLoaded: function(start,end){
    var available = this.actualData.slice(start, end)
    var remaining = _.compact(available)
    return remaining.length == end-start
  },

  //fetch only if we don't have the values
  _fetchOr: function(options){
    options = _.cloneDeep(options)
    var displaced = this.displacement(options)
    var minDisplacement = this.pagination.settings.buffer.minimumDisplacement
    var bufferBoundary = this.pagination.settings.buffer.boundary
    var shouldFetch = false;
    var start = options.data.offset;
    var end = start + options.data.limit;
    var bufferSize = this.pagination.settings.buffer.size;
    if(displaced[0] < minDisplacement || displaced[1] < minDisplacement){
      if(start - bufferSize > 0){
        bufferBoundary[0] = start - bufferSize
      } else {
        bufferBoundary[0] = Infinity;
      }

      bufferBoundary[1] = end + bufferSize;
      shouldFetch = true;
    }

    //convert start/end to offset/limit
    options.data.offset = bufferBoundary[0]

    if(options.data.offset == Infinity){
      options.data.offset = 0
    }

    options.data.limit = bufferBoundary[1] - options.data.offset



    if(shouldFetch){
      var bufferResponse = this.fetch(options)
        .then(this._updateActualData.bind(this,options))
    }
    if( this._isInitialDataSetLoaded(start,end) ){
      var result = this.actualData.slice(start,end);
    return result.length && Promise.resolve({ result: result }) || bufferResponse
    } else {
      return bufferResponse || Promise.resolve({ result: this.actualData.slice(start,end) })
    }
  },

  displacement: function(options){
    var start = options.data.offset;
    var end = start + options.data.limit;
    var bufferBoundary = this.pagination.settings.buffer.boundary

    var bufferLeft = bufferBoundary[0] - start
    if(bufferLeft < 0){
      bufferLeft = Infinity
    }
    return [
      bufferLeft,
      bufferBoundary[1] - end
    ]

  },

  _fetchPage: function(options){
    if(!this.pagination.state.pending){
      this.pagination.state.pending = true;
      return this._fetchOr(options)
        .then(this._updatePaginationStates.bind(this,options))
        .then(this._onFinishPageFetch.bind(this))
    } else {
      return Promise.reject("Already Pending a Request")
    }
  }

})
