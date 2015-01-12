var Backbone = require('Backbone')

module.exports = Backbone.View.extend({
  tagName: 'img',

  attributes: function(){
    return {
      src: this.src()
    }
  },

  src: function(){
    var src = this.model.get('file_url').replace('_size_','square')
    if(this.model.get('file_type') == 'V'){
      src = this.placeHolder()
    }
    return src
  },

  placeHolder: function(){
    var can = document.createElement('canvas')
    con = can.getContext('2d')
    can.width = can.height = 200


    con.font="55px Helvetica";
    con.fillText('Video',25,120)
    return can.toDataURL()
  }

})
