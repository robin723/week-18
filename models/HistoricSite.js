var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var HistoricSiteSchema = new Schema({
  name: {
    type:String,
    required:true
  },
  link: {
    type:String,
    required:false
  },
  add: {
    type:String,
    required:false
  },
  loc: {
    type:String,
    required:false
  },
  phone: {
    type:String,
    required:false
  },
  visited: {
    type:Boolean,
    default:false
  },
  note: {
      type: Schema.Types.ObjectId,
      ref: 'Note'
  }
});

var HistoricSite = mongoose.model('HistoricSite', HistoricSiteSchema);
module.exports = HistoricSite;
