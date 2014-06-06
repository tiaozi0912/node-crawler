var http = require("http"),
    mongoose = require("mongoose");

// Connect to local database
mongoose.connect('mongodb://localhost/crawler');

// Define post model. 
// TODO: move to model folder
var Schema = mongoose.Schema;

var postsSchema = new Schema({
  title: String,
  price: Number,
  url: String,
  location: String
});

var Post = mongoose.model('posts', postsSchema);

// Utility function that downloads a URL and invokes
// callback with the data.
function download(url, callback) {
  http.get(url, function(res) {
    var data = "";
    res.on('data', function (chunk) {
      data += chunk;
    });
    res.on("end", function() {
      callback(data);
    });
  }).on("error", function() {
    callback(null);
  });
}

var cheerio = require("cheerio");

var url = "http://sfbay.craigslist.org/search/apa?query=palo+alto&sale_date=-&maxAsk=1800";

download(url, function(data) {
  if (data) {
    //console.log(data);

    var $ = cheerio.load(data);
    
    var parsedData = parseData($);

    save(parsedData);
      
    console.log("done");
  }
  else console.log("error");  
});

// parse data
function parseData($) {
  var rows = [];

  $('.content .row').each(function() {
    var $_this = $(this),
        priceText = $_this.find('.price').text();

    var item = {
      price: parsePrice(priceText),
      title: $_this.find('.pl').text(),
      url: $_this.find('.pl a').attr('href'),
      location: $_this.find('.pnr small').text()
    };

    rows.push(item);
  });

  console.log(rows);
  return rows;
}

function parsePrice(priceText) {
	var p = priceText.match(/\d+/);

	return p ? parseInt(p[0]) : 0;
}

// save posts to database
function save(data) {
  data.forEach(function(d) {
    var item = new Post(d);
    item.save(function(err) {
      if (err) {
      	console.log(err);
      }
    });
  });
}

