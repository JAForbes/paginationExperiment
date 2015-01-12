var R = require('ramda')
var Backbone = require('Backbone')
var _ = require('lodash')

module.exports = Backbone.View.extend({
  el: controls,
  events: {
    'change #left': 'changeLeft',
    'change #right': 'changeRight',
    'click #current': 'clickCurrent',
    'click #prev': 'clickPrev',
    'click #next': 'clickNext'
  },

  changeSetting: function(path,e){
      var parts = path.split('.')
      var attr = parts.slice(-1)[0];
      var path = parts.slice(0,-1).join('.')

      R.path(path,grid.collection)[attr] = e.currentTarget.value * 1
      this.collection.fetchCurrentPage()
  },

  initialize: function(){

    _.each(['Current','Prev','Next'],function(val){
      this['click'+val] = function(){
          return this.collection['fetch'+val+'Page']()
      }
    },this)

  }
})
