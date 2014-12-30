var Backbone = require('Backbone')

module.exports = Backbone.View.extend({
  tagName: 'img',

  attributes: function(){
    return {
      src: this.model.get('file_url').replace('_size_','square')
    }
  }

})
