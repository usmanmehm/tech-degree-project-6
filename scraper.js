var Crawler = require("crawler");
var json2csv = require('json2csv').parse;
var fs = require('fs');

// Arrays that will store the URLs and shirt info
let shirtURLs = [];
let shirts = [];

//These date variables will be used to log errors and the file name
// A conditional is used after most of them to ensure that, for example,
// if the time is 9:08, it won't print as 9:8
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


// The crawler that gets the URLs of the individual shirts
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
        done();
    }
});

// Queue just one URL, with default callback
c.queue('http://shirts4mike.com/shirts.php');


// A delay is used to ensure the initial scraping has completed
// The URLs are then accessed one-by-one and the shirt info is scraped
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

// Another delay is used to make sure that the shirt info is scraped
// Then the .csv file is made within a data folder. The program will check
// whether the data folder exists and if not, will create it.
setTimeout( function () {
  console.log(shirts);
  const options = {
    fields: ''
  }
  // This will catch errors where data was not scraped from the web or this function
  // executed before the scraping was done.
  if (shirts.length !== 0) {
    try {
      const csv = json2csv(shirts);
      if (!fs.existsSync('./data')){
          fs.mkdirSync('./data');
      }
      fs.writeFile("data/" + dayMonthYear + ".csv", csv, err => {
        console.log('Scraping successful and file successfully written to disk');
        if (err) throw err;
       })

   // For any other errors. 
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
