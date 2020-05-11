// for read file
const fs = require('fs')
const csv = require('csv-parser')

// for http request 
const fetch = require('node-fetch');

//scraping
const cheerio = require('cheerio');

//get Domain
const extractDomain = require('extract-domain');

//regex for phone and mail
let phoneRegEx = / *(?:\+?(\d{1,3}))?([-. (]*(\d{3})[-. )]*)?((\d{3})[-. ]*(\d{2,4})(?:[-.x ]*(\d+))?)\s*$/gm
let mailRegEx = / *\b[\w\.-]+@[\w\.-]+\.\w{2,4}\b/g

// some array to save data in run time
let urls = [], finalData = [], arr = [];


// for save file
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const csvWriter = createCsvWriter({
    path: 'output.csv',
    header: [{ id: 'status', title: 'status' },
    { id: 'subURLS', title: 'subURLS' },
    { id: 'data', title: 'data' },
    { id: 'url', title: 'URL' }
    ]
});







//main part
fs.createReadStream('data.csv')
    .pipe(csv())
    .on('data', (line) => {
        saveLine(line);
    })
    .on('end', async () => {

        for (let url of urls) {
            await firstFetch(url);
        }
        save(finalData)
    })





// for handle urls that come from .csv file
function saveLine(line) {
    line = JSON.stringify(line);
    line = line.substring(8, line.length - 2);
    urls.push(line)
}



async function firstFetch(url) {
    // object for main url
    let bigdata = {
        status: 0,
        url: url,
        data: {
            phone: [], mail: []
        },
        subURLS: []
    }


    await fetch(url)
        .then(async res => {
            bigdata.status = res.status;
            // console.log(bigdata.status);
            return await res.text()
        })
        .then(async body => {
            // console.log('fetch one');
            let $ = cheerio.load(body);
            let dataFound = $(body).text();
            //save data for main url 
            bigdata.data.phone = dataFound.match(phoneRegEx);
            bigdata.data.mail = dataFound.match(mailRegEx);

            $('a').each(async (i, el) => {
                let givenURL = $(el).attr('href');
                // condetion for filering the found urls
                if (typeof givenURL == "string" && extractDomain(givenURL) == extractDomain(url)) {
                    arr.push(givenURL);
                }
            })

            // console.log(arr);
            for (const url of arr) {
            //go to second fetch to looking for data 
                let foundData = await secondFetch(url);
                //save the data thats found in bigdata.subURLS
                bigdata.subURLS.push(foundData)
            }
            return bigdata;
        }
        )
        .catch(err => console.log("error in first fetch----->" + err + "the url  " +url))


    finalData.push(bigdata);
    // console.log(bigdata);


}




async function secondFetch(url) {
    // small object to save each data in urls that found in main url 
    let smallData = {
        status: 0,
        url: url,
        data: {
            phone: [], mail: []
        }
    }

    await fetch(url)
        .then(async res => {
            smallData.status = res.status
            return await res.text()
        })
        .then(async body => {
            // console.log('fetch two');

            let $ = cheerio.load(body);
            smallData.data.mail = $(body).text().match(mailRegEx)
            smallData.data.phone = $(body).text().match(phoneRegEx)

        })
        .catch(err => console.log("error in second fetch----->" +  err + "the url  "+ url))
    return smallData;
}








async function save(data) {
    csvWriter
        .writeRecords(data)
        .then(() => console.log('The CSV file was written successfully'));

}