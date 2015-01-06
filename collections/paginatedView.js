var Backbone = require('Backbone')
var DataCollection = require('./paginatedCollection')

module.exports = Backbone.Collection.extend({

  initialize: function(options){
    this.data = new (DataCollection.extend({ model: this.model }))
    this.data.url = this.url;
    this.data.parse = this.parse;
    this.pagination = this.data.pagination
    this.fetchInitialBuffer()
  },

  fetchInitialBuffer: function(){
    var request = {
      data: {
        offset: this.data.pagination.settings.sync.data.offset,
        limit: this.data.pagination.settings.buffer.forward.amount // e.g. 100
      },
      remove: false
    }
    return this.data.fetch(request)
      .then( this.data._updateActualData.bind(this.data,request) )
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
    console.log('updateSlice')
    var offset = this.pagination.settings.sync.data.offset
    var limit = this.pagination.settings.sync.data.limit
    var remaining =
      _.compact(
        this.data.actualData.slice(
          Math.max(0,offset),
          offset+limit
        )
      )


    //should trigger add remove etc
    this.set(remaining)
    this.trigger('sync',this)
  }
})
