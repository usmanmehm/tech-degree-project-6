var Crawler = require("crawler");
var json2csv = require('json2csv').parse;
var fs = require('fs');

let shirtURLs = [];
let shirts = [];
let reqInProgress= true;

const dir = './data';


const date = new Date();
let hour = date.getHours();
hour = hour > 9? hour : "0" + hour;
let minutes = date.getMinutes();
minutes = minutes > 9? minutes : "0" + minutes;
let year = date.getFullYear();
let month = date.getMonth()+1;
month = month > 9? month : "0" + month;
let day = date.getDate();
day = day > 9? day : "0" + day;
const dayMonthYear = year + "-" + month + "-" + day;

var c = new Crawler({
    maxConnections : 10,
    retries: 0,
    // This will be called for each crawled page
    callback : function (error, res, done) {
        if(error){
            const errorMessage = date + ': There was an error connecting to the website. Error message: ' + error.message + '\n';
            console.log(errorMessage);
            fs.appendFile('error-log.txt', errorMessage, (err) => {
              if (err) throw err;
              console.log('The error log was updated!');
            });
        }else{
            var $ = res.$;
            // $ is Cheerio by default
            //a lean implementation of core jQuery designed specifically for the server
            const shirtList = $('.products li a');
            for (let i = 0; i < shirtList.length; i++) {
              let shirtURL = 'http://shirts4mike.com/' + shirtList[i].attribs.href;
              shirtURLs.push(shirtURL);
            }


        }
        reqInProgress = false;
        done();
    }
});

// Queue just one URL, with default callback
c.queue('http://shirts4mike.com/shirts.php');

setTimeout( function () {
    shirtURLs.forEach( URL => {
      c.queue([{
        uri: URL,
        callback: function (error, res, done) {
            if(error){
              const errorMessage = date + ': There was an error connecting to the website. Error message: ' + error.message + '\n';
              console.log(errorMessage);
              fs.appendFile('error-log.txt', errorMessage, (err) => {
                if (err) throw err;
                console.log('The error log was updated!');
              });
            }else{
              var $ = res.$;
              const price = $('.price').text();
              const title = $("title").text();
              const imageURL = 'http://shirts4mike.com/' + $('.shirt-picture img')[0].attribs.src;
              // const URL =
              shirtInfo = {
                title,
                price,
                imageURL,
                URL,
                time: hour + ':' + minutes
              }
              shirts.push(shirtInfo);
            }
            done();
        }
    }]);
  })

}, 4000);




setTimeout( function () {
  console.log(shirts);
  const options = {
    fields: ''
  }
  if (shirts.length !== 0) {
    try {
      const csv = json2csv(shirts);
      if (!fs.existsSync(dir)){
          fs.mkdirSync(dir);
      }
      fs.writeFile("data/" + dayMonthYear + ".csv", csv, err => {
        console.log('Scraping successful and file successfully written to disk');
        if (err) throw err;
       })
    } catch (err) {
      const errorMessage = date + ': There was an error converting the data to .csv! Error message: ' + error.message + '\n';
      console.log(errorMessage);
      fs.appendFile('error-log.txt', errorMessage, (err) => {
        if (err) throw err;
        console.log('The error log was updated!');
      });
    }
  } else {
    const errorMessage = date + ': There was an error converting the data to .csv! No data was scraped from the web.\n';
    console.log(errorMessage);
    fs.appendFile('error-log.txt', errorMessage, (err) => {
      if (err) throw err;
      console.log('The error log was updated!');
    });
  }
}, 5500)
