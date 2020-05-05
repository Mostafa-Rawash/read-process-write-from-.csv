import { createReadStream } from 'fs';
import request from 'request';
import csv from 'csv-parser';
import { createObjectCsvWriter as createCsvWriter } from 'csv-writer';
let data = [];
let urls = [];
const csvWriter = createCsvWriter({
    path: 'output.csv',
    header: [{ id: 'code', title: 'CODE' }, { id: 'err', title: 'ERROR' }, { id: 'url', title: 'URL' }]
});

function Req(url) {
    return new Promise((resolve, reject) => {
        request(url, (err, res, body) => {
            data.push(
                { url: url, err: `${err}`, code: res.statusCode }
            )
            resolve();
        })
    });
}

createReadStream('data.csv').pipe(csv())
    .on('data', (url) => {

        //            read data from file
        url = JSON.stringify(url);
        url = url.substring(8, url.length - 2);
        urls.push(url)

    }).on('end', async () => {
        for (let i = 0; i < urls.length; i++) {

            //           collect status code in 'data' array
            await Req(urls[i])
        }
        //                sava data in 'output.csv'
        csvWriter
            .writeRecords(data)
            .then(() => console.log('The CSV file was written successfully'));
    });