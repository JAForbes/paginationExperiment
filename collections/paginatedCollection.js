var Backbone = require('Backbone')
var cloneDeep = require('lodash').cloneDeep

module.exports = Backbone.Collection.extend({

  //Pagination ajax settings passed to fetch
  pagination: {
    //Backbone sync settings e.g. collection.fetch(pagination.sync)
    sync: {
      data:{
        offset: 0,
        limit: 100
      },
      //remove: false //will not clear collection after a fetch
    },

    state: {
      lastRequestSize: null,
      lastPageDirection: null,
      pending: false
    }
  },
  fetchPrevPage: function(){
    return this._fetchPageDirection('Prev');
  },

  fetchNextPage: function(){
    return this._fetchPageDirection('Next');
  },

  hasNext: function(){
    return this.pagination.state.lastPageDirection == 'Next' && this.pagination.state.lastRequestSize ||
      this.pagination.sync.data.offset <= 0
  },

  hasPrev: function(){
    return this.pagination.sync.data.offset > 0;
  },

  _onFetchPage: function(request,response){
    this.pagination.state.lastPageDirection = request.data.offset > this.pagination.sync.data.offset ? 'Next' : 'Prev'
    this.pagination.state.lastRequestSize = response.result.length;
    this.pagination.sync = request;
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
      var paginationSync = cloneDeep(this.pagination.sync)

      paginationSync.data.offset += paginationSync.data.limit * direction;
      return this._fetchPage(paginationSync)
    } else {
      this._throwFetchError(directionName)
    }
  },

  _fetchPage: function(options){
    this.pagination.state.pending = true;
    return this.fetch(options || this.paginated)
      .then(this._onFetchPage.bind(this,options))
      .done(this._onFinishPageFetch.bind(this))
  }
})
