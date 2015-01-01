var R = require('ramda')

module.exports = Backbone.View.extend({
  el: controls,
  events: {
    'change #limit': 'changeLimit',
    'change #offset': 'changeOffset',
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
    this.changeLimit = _.partial(this.changeSetting,'pagination.settings.sync.data.limit')
    this.changeOffset = _.partial(this.changeSetting,'pagination.settings.sync.data.offset')
    this.changeLeft = _.partial(this.changeSetting,'settings.padding.0')
    this.changeRight = _.partial(this.changeSetting,'settings.padding.1')

    _.each(['Current','Prev','Next'],function(val){
      this['click'+val] = function(){
        this.collection['fetch'+val+'Page']()
      }
    },this)
  }
})
