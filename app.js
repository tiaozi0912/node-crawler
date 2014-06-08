var express = require('express');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var posts = require('./routes/posts');

var mongoose = require('mongoose');
var fs = require('fs');

var app = express(); 

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//load all files in models dir
fs.readdirSync(__dirname + '/models').forEach(function(filename) {
  if (~filename.indexOf('.js')) require(__dirname + '/models/' + filename);
});

app.use('/', routes);
app.use('/posts', posts);

/// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });

    mongoose.connect('mongodb://localhost/crawler');
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


/**
 * Set scheduler to crawl
 */
var Crawler = require('./crawler');
var crawler = new Crawler();

var CronJob = require('cron').CronJob;

var emailSender = require('./emailSender');

var async = require('async');

// Register job to run
function job() {
  var url = "http://sfbay.craigslist.org/search/apa?query=palo+alto&sale_date=-&maxAsk=1800";

  crawler.fetch(url, function(data) {
    // Compare the fetched data with the data stored in database
    // If there is something new
    // Send an email alert and store the new item into database
    var newPosts = [];
    var Post = mongoose.model('posts');

    async.each(data, function(d, callback) {
      Post.find({title: d.title}, function(err, p) {
        if (err) {
          console.log(err);
        } else {
          if (!p.length) {
            newPosts.push(d);
          }
        }

        // callback must be called to 
        //indicate the iterator function is finished
        callback();
      });
    }, function(err) {
      // All queries are done
      console.log('All queries finished');
      handleNewPosts(newPosts, Post);
    });    
  });
}

function handleNewPosts(newPosts, Post) {
  newPosts.forEach(function(post) {
    var item = new Post(post);
    item.save(function(err) {
      if (err) {
        console.log(err);
      } else {
        console.log('saved!');
      }
    });
  });

  if (newPosts.length > 0) {
    emailSender.send(newPosts);
  }
}

function testingJob() {
  console.log('doing the job');
}

// job run every 5mins
//new CronJob('* */5 * * * *', job, null, true, "America/Los_Angeles");

job.call();

module.exports = app;
