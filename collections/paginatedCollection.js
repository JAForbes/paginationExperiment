var Backbone = require('Backbone');

module.exports = Backbone.Collection.extend({

  //Pagination ajax settings passed to fetch
  pagination: {
    data:{
      offset: 0,
      limit: 100
    },
    //remove: false //will not clear collection after a fetch
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
      return this._fetchPage(this.pagination)
    } else {
      this.throwFetchError('Prev')
    }
  },

  fetchNextPage: function(){
    if(files.hasNext){
      //todo clone, and set to pagination data if result.length > 0
      this.pagination.data.offset+=this.pagination.data.limit;
      return this._fetchPage(this.pagination)
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

  //internal usage
  _fetchPage: function(options){
    return this.fetch(options || this.paginated)
      .then(this.onFetchPage.bind(this))
  }
})
