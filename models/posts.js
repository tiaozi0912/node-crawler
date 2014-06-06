var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var postsSchema = new Schema({
  title: String,
  price: Number,
  url: String,
  location: String
});

mongoose.model('posts', postsSchema);
