// //import necessary modules and libraries
// import fs from "fs";
// import axios from "axios";
// import * as cheerio from "cheerio";
// import fetch from "node-fetch";
// import GeoJSON from 'geojson';
// import fse from 'fs-extra';
// import { v4 as uuidv4 } from "uuid"; // Import v4 function as uuidv4
// import { dateformat } from '../scripts/date.js';

// //update the following variables
// const spider_name = "cocotea_ph"
// const start_urls = "https://coco-tea.ph/"
// const brand_name = "CoCo Tea"
// const spider_type = "chain"
// const source = "DPA_SPIDERS"
// const chain_id = "32539"
// const chain_name = "CoCo Tea"
// const categories = "100-1100-0010";
// const foodtypes = null;

// const processScraping = async () => {
//     // Configure axios to ignore SSL certificate validation errors
//     process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

//     const savename = "cocotea_ph";
//     console.log('start fetching')
//     let jsonData = {
//         siteId: '134',
//         chainName: '',
//         ISO: 'PHL',
//         SN: '100-1100-0010',
//         category: 'Coffee Shop',
//         url: 'https://coco-tea.ph/quezon-city/',
//         entities: []
//     }

//     let htmlString = ``

//     const res = await axios.get(jsonData.url)
//     htmlString = res.data

//     const $ = cheerio.load(htmlString);

//     let entities = []
//     let count = 0

//     $('.uk-margin-large-bottom').each((index, ele) => {
//         const name = $(ele).find('.wk-panel-title').text()
//         const info = $(ele).find('p').eq(0).text().replace(/\s*\n\s*/g, ', ') + ', ' +  $(ele).find('.workHours').eq(1).text()
//         const address =  info.split(',')[0] + ', ' + info.split(',')[1] + ', ' + info.split(',')[2]+ ',' + info.split(',')[3]+ ',' + info.split(',')[4]
//         const info2 = info.split(',')
//         const workHours1 = info2[info2.length - 2]
//         const  workHours2 = info2[info2.length - 1]
//         const  workHours3 = info2[info2.length - 3]
//         const workHours = workHours1 + ', ' + workHours2 + ', ' + workHours3
//         const link = $(ele).find('iframe').attr('src');

//         function extractLatLng(link) {
//             const latPattern = /!3d(\d+\.\d+)!/g;
//             const lngPattern = /!2d(\d+\.\d+)!/g;
            
//             const match = link.match(latPattern);
//             const match2 = link.match(lngPattern);
//             // console.log('match-> ', match);
//             // console.log('match2-> ', match2);

//             if (match && match2) {
//                 const lat = parseFloat(match[0].substring(3));
//                 const lng = parseFloat(match2[0].substring(3));
//                 return { lat, lng };
//             } else {
//                 return null;
//             }
//         }

//         const latlng = extractLatLng(link);

//         entities.push({
//             name: name.trim(),
//             info: info,
//             workHours: workHours,
//             address: address.trim(),
//             link: link,
//             latlng: latlng
//         })
//     })
//     console.log('res-> ', entities[0])
//     jsonData.entities = entities
//     fs.writeFileSync(`../2024-1-done/${savename}.json`, JSON.stringify(jsonData, null, 2));

// };
// processScraping()

//import necessary modules and libraries
import fs from "fs";
import axios from "axios";
import * as cheerio from "cheerio";
import fetch from "node-fetch";
import GeoJSON from 'geojson';
import fse from 'fs-extra';
import { v4 as uuidv4 } from "uuid"; // Import v4 function as uuidv4
import { dateformat } from '../scripts/date.js';

//update the following variables
const spider_name = "cocotea_ph"
const start_urls = "https://coco-tea.ph/"
const brand_name = "CoCo Tea"
const spider_type = "chain"
const source = "DPA_SPIDERS"
const chain_id = "32539"
const chain_name = "CoCo Tea"
const categories = "100-1100-0010";
const foodtypes = null;

const processScraping = async () => {
    // Configure axios to ignore SSL certificate validation errors
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

    const savename = "cocotea_ph";
    console.log('start fetching')
    let jsonData = {
        siteId: '134',
        chainName: '',
        ISO: 'PHL',
        SN: '100-1100-0010',
        category: 'Coffee Shop',
        url: 'https://coco-tea.ph/quezon-city/',
        entities: []
    }

    let htmlString = ``

    const res = await axios.get(jsonData.url)
    htmlString = res.data

    const $ = cheerio.load(htmlString);

    let entities = []
    let count = 0

    $('.uk-margin-large-bottom').each((index, ele) => {
        const name = $(ele).find('.wk-panel-title').text()
        const info = $(ele).find('p').eq(0).text().replace(/\s*\n\s*/g, ', ') + ', ' +  $(ele).find('.workHours').eq(1).text()
        const address =  info.split(',')[0] + ', ' + info.split(',')[1] + ', ' + info.split(',')[2]+ ',' + info.split(',')[3]+ ',' + info.split(',')[4]
        const info2 = info.split(',')
        const workHours1 = info2[info2.length - 2]
        const  workHours2 = info2[info2.length - 1]
        const  workHours3 = info2[info2.length - 3]
        const workHours = workHours1 + ', ' + workHours2 + ', ' + workHours3
        const link = $(ele).find('iframe').attr('src');

        function extractLatLng(link) {
            const latPattern = /!3d(\d+\.\d+)!/g;
            const lngPattern = /!2d(\d+\.\d+)!/g;
            
            const match = link.match(latPattern);
            const match2 = link.match(lngPattern);
            // console.log('match-> ', match);
            // console.log('match2-> ', match2);

            if (match && match2) {
                const lat = parseFloat(match[0].substring(3));
                const lng = parseFloat(match2[0].substring(3));
                return { lat, lng };
            } else {
                return null;
            }
        }

        const latlng = extractLatLng(link);

        entities.push({
            name: name.trim(),
            info: info,
            workHours: workHours,
            address: address.trim(),
            link: link,
            latlng: latlng
        })
    })
    console.log('res-> ', entities[0])
    jsonData.entities = entities
    fs.writeFileSync(`../2024-1-done/${savename}.json`, JSON.stringify(jsonData, null, 2));

};
processScraping()

// branch_root = response.xpath('//div[@id="store-location"]/ul/li/a/@href')
//         for branch in branch_root:
//             link = branch.xpath('.//ul/li[1]/div[2]/a/@href').get()
//             yield response.follow(link, callback=self.parse_detail_page )

            //div[@class="uk-first-column"]

// branch root = //div[@id="store-location"]/ul/li/a/@href     
    // fisrt link =  //div[@class="uk-first-column"]/div/ul/li/a/@href
        //nested first = //div[@class="uk-first-column"]/div/ul/li/ul/li/a/@href