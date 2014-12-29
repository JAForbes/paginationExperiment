var Backbone = require('Backbone')
var cloneDeep = require('lodash').cloneDeep

module.exports = Backbone.Collection.extend({

  //Pagination ajax settings passed to fetch
  pagination: {
    data:{
      offset: 0,
      limit: 100
    },
    //remove: false //will not clear collection after a fetch
  },

  paginationState: {
    lastRequestSize: null,
    lastPageDirection: null,
    pending: false
  },

  fetchPrevPage: function(){
    return this._fetchPageDirection('Prev');
  },

  fetchNextPage: function(){
    return this._fetchPageDirection('Next');
  },

  hasNext: function(){
    return this.paginationState.lastPageDirection == 'Next' && this.paginationState.lastRequestSize ||
      this.pagination.data.offset <= 0
  },

  hasPrev: function(){
    return this.pagination.data.offset > 0;
  },

  _onFetchPage: function(request,response){
    this.paginationState.lastPageDirection = request.data.offset > this.pagination.data.offset ? 'Next' : 'Prev'
    this.paginationState.lastRequestSize = response.result.length;
    this.pagination = request;
  },

  _onFinishPageFetch: function(){
    this.paginationState.pending = false;
  },

  _throwFetchError: function(direction){
    throw "Attempted to fetch"+direction+"Page when has"+direction+"() returned false."
  },

  _fetchPageDirection: function(directionName){

    var direction = ({ Next: 1, Prev: -1})[directionName]

    if(this['has'+directionName]()){
      //clone, so if the setings are incorrect, we don't lose anything
      var pagination = cloneDeep(this.pagination)

      pagination.data.offset += pagination.data.limit * direction;
      return this._fetchPage(pagination)
    } else {
      this._throwFetchError(directionName)
    }
  },

  _fetchPage: function(options){
    this.paginationState.pending = true;
    return this.fetch(options || this.paginated)
      .then(this._onFetchPage.bind(this,options))
      .done(this._onFinishPageFetch.bind(this))
  }
})
