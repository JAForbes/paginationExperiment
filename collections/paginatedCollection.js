var Backbone = require('Backbone')
var cloneDeep = require('lodash').cloneDeep

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
        remove: false, //will not clear collection after a fetch
      },
      //what proportion of the limit to delete after every fetch
      forgetRatio: 1,
      //what proportion of the limit to keep before starting to forget
      keepRatio: 3
    },

    state: {
      lastRequestSize: null,
      lastPageDirection: null,
      pending: false
    }
  },

  forgetItems: function(syncOptions){
    var forgetRatio = this.pagination.settings.forgetRatio // 0.2
    var lastPageDirection = this.pagination.state.lastPageDirection // 'Next' | 'Prev'
    var limit = this.pagination.settings.sync.data.limit;
    var keepRatio = this.pagination.settings.keepRatio
    if( this.length > limit*keepRatio ) {
      var itemsToForget = Math.floor(limit * forgetRatio) // 20

      var sliceArgs = ({
        Next: [itemsToForget], //[20]
        Prev: [0,-itemsToForget]  //[0, -20]
      })[lastPageDirection] // sliceArgs.Next //=> [0, 20]
      var remaining = this.slice.apply(this,sliceArgs); //collections.slice(0,-20)
      this.set(remaining); //fires 'remove' for 20 models
    }
    return syncOptions
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

  fetchCurrent: function(){
    this.fetch(this.pagination.settings.sync)
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
      var paginationSync = cloneDeep(this.pagination.settings.sync)

      paginationSync.data.offset += paginationSync.data.limit * direction;
      return this._fetchPage(paginationSync)
    } else {
      this._throwFetchError(directionName)
    }
  },

  _fetchPage: function(options){
    this.pagination.state.pending = true;
    return this.fetch(options)
      .then(this._removeDuplicates)
      .then(this._updatePaginationStates.bind(this,options))
      .then(this.forgetItems.bind(this))
      .done(this._onFinishPageFetch.bind(this))
  }
})
