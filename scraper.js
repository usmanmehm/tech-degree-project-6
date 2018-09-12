var Crawler = require("crawler");
var json2csv = require('json2csv').parse;
var fs = require('fs');

let shirtURLs = [];
let shirts = [];

var c = new Crawler({
    maxConnections : 10,
    // This will be called for each crawled page
    callback : function (error, res, done) {
        if(error){
            console.log(error);
        }else{
            var $ = res.$;
            // $ is Cheerio by default
            //a lean implementation of core jQuery designed specifically for the server
            const shirtList = $('.products li a');
            for (let i = 0; i < shirtList.length; i++) {
              let shirtURL = 'http://shirts4mike.com/' + shirtList[i].attribs.href;
              shirtURLs.push(shirtURL);
            }
            console.log(shirtURLs);
        }
        done();
    }
});

// Queue just one URL, with default callback
c.queue('http://shirts4mike.com/shirts.php');

setTimeout(
  function () {
    shirtURLs.forEach( URL => {
      c.queue([{
        uri: URL,

        callback: function (error, res, done) {
            if(error){
              console.log(error);
            }else{
              var $ = res.$;
              const price = $('.price').text();
              const title = $("title").text();
              const imageURL = 'http://shirts4mike.com/' + $('.shirt-picture img')[0].attribs.src;
              // const URL =
              shirtInfo = {
                "title": title,
                "price": price,
                "URL": URL,
                "imageURL": imageURL
              }
              shirts.push(shirtInfo);
            }
            done();
        }
    }]);
  })

}, 1000);

setTimeout( function () {
  // console.log(shirts);
  const options = {
    fields: ''
  }
  try {
    const csv = json2csv(shirts);
    console.log(csv);
    fs.writeFile("data/result.csv", csv, err => {
      console.log('File successfully written to disk');
      if (err) throw err;
     })
  } catch (err) {
    console.error(err);
  }

}, 2000)
