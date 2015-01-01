var Backbone = require('Backbone')
var DataCollection = require('./paginatedCollection')

module.exports = Backbone.Collection.extend({

  settings: {
    padding: [0,0]
  },

  initialize: function(options){
    this.data = new (DataCollection.extend({ model: this.model }))
    this.data.url = this.url;
    this.data.parse = this.parse;
    this.pagination = this.data.pagination

  },

  fetchCurrentPage: function(){
    return this.data.fetchCurrent()
      .then(this.updateSlice.bind(this))
  },

  fetchNextPage: function(){
    return this.data.fetchNextPage()
      .then(this.updateSlice.bind(this))
  },

  fetchPrevPage: function(){
    return this.data.fetchPrevPage()
      .then(this.updateSlice.bind(this))
  },

  updateSlice: function(){
    var offset = this.pagination.settings.sync.data.offset
    var limit = this.pagination.settings.sync.data.limit
    var padding = this.settings.padding
    var remaining = this.toJSON.apply(
      this.data.slice(
        Math.max(0,offset-padding[0]),
        offset+limit+padding[1]
      )
    )

    //should trigger add remove etc
    this.set(remaining)
    this.trigger('sync',this)
  }
})
