var Backbone = require('backbone')

var _ = require('lodash')
var R = require('ramda')
var Img = require('./file')

module.exports = Backbone.View.extend({

    initialize: function(options){
      this.collection.on('sync',this.render.bind(this))
    },

    createImgEl: R.pipe(
      R.createMapEntry('model'),
      R.construct(Img),
      R.get('el')
    ),

    render: function(collection){
      var els = collection.map( this.createImgEl );
      this.$el.empty().append(els)
    },
})
