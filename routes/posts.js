var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');

/* GET posts listing. */
router.get('/', function(req, res) {
  mongoose.model('posts').find(function(err, posts) {
  	posts.reverse();
    res.render('posts', {posts: posts});
  });
});

module.exports = router;
