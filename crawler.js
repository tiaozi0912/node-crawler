var Crawler = function() {
  this.http = require("http"),
  this.cheerio = require("cheerio");
};


Crawler.prototype.fetch = function(url, callback) {
  var self = this;

  // Utility function that downloads a URL and invokes
  // callback with the data.
  function download(url, callback) {
    self.http.get(url, function(res) {
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

  // Parse data from html document 
  // Get price, title, url, location
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
  
  // Parse the price from string to number
  function parsePrice(priceText) {
    var p = priceText.match(/\d+/);

    return p ? parseInt(p[0]) : 0;
  }

  download(url, function(data) {
    if (data) {
      var $ = self.cheerio.load(data),
          parsedData = parseData($);

      parsedData.reverse();

      if (callback) {
        callback(parsedData);
      }
      
      console.log("done");
    } else {
      console.log("error");  
    }
  });
};

module.exports = Crawler;
