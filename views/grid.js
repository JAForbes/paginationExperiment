var Backbone = require('backbone')

var _ = require('lodash')
var Img = require('./file')

module.exports = Backbone.View.extend({

    initialize: function(options){
      this.collection.on('sync',this.render.bind(this))
    },

    render: function(collection){
      var imgs = collection.map(function(model){

        this.$el.empty().append(
          new Img({ model: model }).el
        )

      },this)

    },
})
