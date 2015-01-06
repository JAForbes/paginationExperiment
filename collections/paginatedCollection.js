var Backbone = require('Backbone')
var _ = require('lodash')
var Promise = require('promise')

/*
  Problems

  Need to initialize buffer when ever offset is set, including init
*/

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

      buffer: {
        back: { delta: 50, amount: 100, lastOffset: 0 }, //todo ensure synced to initial/teleported offset
        forward: { delta: 50, amount: 100 ,lastOffset: 0 },
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

  _bufferLoaded: function(actualData,offset,limit,desiredSize){
    //actualData is sparse, compact() forces it to be contiguous

    console.log(_.compact(

      //how long is our cached buffer?
      actualData.slice( offset, limit)

    ).length, desiredSize,offset,limit)

    return _.compact(

      //how long is our cached buffer?
      actualData.slice( offset, limit)

    ).length >= desiredSize //is it long enough?
  },

  //adjust the offset and limit to request an extra buffer
  //only adjust if the buffer isn't already available in actualData
  _addBuffer: function(options,buffer,actualData){
    var buffer = _.cloneDeep(buffer)
    var offset = options.data.offset;
    var limit = options.data.limit;
    var backBufferNotLoaded;
    var forwardBufferNotLoaded;



    var backBufferNotLoaded = ! this._bufferLoaded(
      actualData,
      offset - buffer.back.amount,
      buffer.back.lastOffset,
      buffer.back.delta
    ) && (offset - buffer.back.amount - buffer.back.delta > 0)

    var forwardBufferNotLoaded = ! this._bufferLoaded(
      actualData,
      offset + limit,
      buffer.forward.lastOffset + limit + buffer.forward.amount,
      buffer.forward.delta
    )
    //extend offset/limit if not loaded

    var requests = {}

    if(backBufferNotLoaded) {
      requests.back = {
        offset: offset - buffer.back.amount - buffer.back.delta,
        limit: buffer.back.amount
      }
    }
    if(forwardBufferNotLoaded){
      requests.forward = {
        offset: offset + buffer.forward.delta,
        limit: buffer.forward.amount
      }
    }

    return requests
  },

  _fetchBuffer: function(request){
    var request = _.cloneDeep(request)
    var buffered = this._addBuffer(
      request,
      this.pagination.settings.buffer,
      this.actualData
    )
    if(buffered.back) {
      this.pagination.settings.buffer.back.lastOffset = request.data.offset
      var backRequest = _.cloneDeep(request)
      backRequest.data.offset = buffered.back.offset
      backRequest.data.limit = buffered.back.limit
      console.log('backRequest.data',backRequest.data)
      this.fetch(backRequest)
        .then(this._updateActualData.bind(this,backRequest))
    }
    if(buffered.forward) {
      this.pagination.settings.buffer.forward.lastOffset = request.data.offset
      var forwardRequest = _.cloneDeep(request)
      forwardRequest.data.offset = buffered.forward.offset
      forwardRequest.data.limit = buffered.forward.limit
      console.log('forwardRequest.data',forwardRequest.data)
      this.fetch(forwardRequest)
        .then(this._updateActualData.bind(this,forwardRequest))
    }
  },

  //fetch only if we don't have the values
  _fetchOr: function(options){

    var offset = options.data.offset;// = buffered.offset
    var limit = options.data.limit;// = buffered.limit

    var remaining = _.compact(this.actualData.slice( offset, offset+limit))

    var alreadyLoaded = remaining.length == limit

    this._fetchBuffer(options)

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
