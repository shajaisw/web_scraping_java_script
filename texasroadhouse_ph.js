// //import necessary modules and libraries
// import axios from 'axios';
// import GeoJSON from 'geojson';
// import fse from 'fs-extra';
// import * as cheerio from 'cheerio';
// import { v4 as uuidv4 } from "uuid"; // Import v4 function as uuidv4
// import { dateformat } from '../scripts/date.js';

// //update the following variables
// const spider_name = "texasroadhouse_ph"
// const start_urls = "https://texasroadhouse.com.ph/"
// const brand_name = "Texas Roadhouse"
// const spider_type = "chain"
// const source = "DPA_SPIDERS"
// const chain_id = "6920"
// const chain_name = "Texas Roadhouse"
// const categories = "100-1000-0001";
// const foodtypes = "800-056";

// // ///////////////////////////////////////////////////////////////////////////////////////////////////////////////

// const processScraping = async () => {
//   // Configure axios to ignore SSL certificate validation errors
//   process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  
//   const savename = "texasroadhouse_ph"
//   console.log('start fetching')
//   let jsonData = {
//     siteId: '178',
//     chainName: 'Texas Roadhouse',
//     ISO: 'PHL',
//     SN: '3318',
//     category: 'Casual Dining',
//     url: 'https://texasroadhouse.com.ph/locations',
//     entities: []
//   }

//   const res = await axios.get(jsonData.url)
//   const htmlString = res.data
//   const $ = cheerio.load(htmlString);
//   let entities = []
//   const scriptString = $('script').eq(7).text()
//   const locationsMatch = scriptString.match(/var locations = (\[.*?\]);\s+function initMap\(\)/s);
//   if (locationsMatch && locationsMatch.length > 1) {
//     const jsonString = locationsMatch[1];
//     const processedString = jsonString.replace(/'/g, '"').replace('S"', 'S');

//     const data = JSON.parse(processedString)

//     for (const item of data) {
//       entities.push({
//         name: item[0],
//         latitude: item[1],
//         longitude: item[2],
//       })
//     }
//     console.log('res-> ', entities[0])
//   }

// //second dataset from store-info

// // $('.store-info').each((index, ele) => {
// //   // const name = $(ele).find('h5').text()
// //   const addressRaw = $(ele).find('address').text().replace(/\s+/g, ' ').trim()
// //   const phoneRegex = /\d{4}-\d{3}-\d{4}/g;
// //   const phone = addressRaw.match(phoneRegex)
// //   const regex = /(MON-SUN|MON-THURS|FRI-SUN|SUN-THURS|MON-FRI|SUN-THU|FRI & SAT): (\d{1,2}AM - \d{1,2}(PM|AM))/g;
// //   const hours = addressRaw.match(regex)
// //     const address = addressRaw.replace(phone, '').replace(hours, '').trim()
// //   entities2.push({
// //     // name: name,
// //     address: address,
// //     phone: phone,
// //     hours: hours
// //   })
    
// // })

// // console.log('res-> ', entities2)

//     jsonData.entities = entities

//     return jsonData.entities;
//     // fs.writeFileSync(`../2024-1-done/${savename}.json`, JSON.stringify(jsonData, null, 2));
// };

// ///////////////////////////////////////////////////////////////////////////////////////////////////////
// //call function processScraping
// const finalData = await processScraping();

// //process json data into geojson format for spider platform
// const features = finalData.map( prop => {
//     return {
//             "addr:full":prop.address,
//             "addr:street":prop.street,
//             "addr:city":prop.city,
//             "addr:state":prop.state,
//             "addr:country":"New Zealand",
//             "addr:postcode":prop.postalCode,
//             "name":prop.name,
//             "Id":prop.id || uuidv4(),
//             "phones":{
//                 "store":[prop.phone]},
//             "fax":{"store":null},
//             "store_url":prop.url,
//             "website":start_urls,
//             "operatingHours":{"store":prop.workHours},
//             "services": prop.services || null,
//             "chain_id": chain_id,
//             "chain_name": chain_name,
//             "brand": brand_name,
//             "categories":categories,
//             "foodtypes":foodtypes,
//             "lat":prop.latitude,
//             "lng":prop.longitude ,
//         }
    
//   });
//   console.log ("{ item_scraped_count:" , features.length,"}")
//   const logfile = `{ "item_scraped_count": ` +features.length + " }"
//   const outputGeojson = GeoJSON.parse(features,{Point:['lat','lng'],removeInvalidGeometries:true});
      
//   const geoExp = JSON.stringify(outputGeojson)
//   fse.outputFileSync(`./output/${source}/${spider_name}/${dateformat}/${spider_name}.geojson`,geoExp)
//   fse.outputFileSync(`./output/${source}/${spider_name}/${dateformat}/${spider_name}_log.json`,logfile)

import fs from "fs";
import axios from "axios";
import * as cheerio from 'cheerio'

const processScraping = async () => {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  const savename = "texasroadhouse_ph"
  console.log('start fetching')
  let jsonData = {
    siteId: '178',
    chainName: 'Texas Roadhouse',
    ISO: 'PHL',
    SN: '3318',
    category: 'Casual Dining',
    url: 'https://texasroadhouse.com.ph/locations',
    entities: []
  }

  let htmlString = ``

  
      const res = await axios.get(jsonData.url)
      console.log(res)
      htmlString = res.data
   
    const $ = cheerio.load(htmlString);
    let entities = []
    let count = 0

    const scriptString = $('script').eq(7).text()
    const locationsMatch = scriptString.match(/var locations = (\[.*?\]);\s+function initMap\(\)/s);
    if (locationsMatch && locationsMatch.length > 1) {
      const jsonString = locationsMatch[1];
      const processedString = jsonString.replace(/'/g, '"').replace('S"', 'S');

      const data = JSON.parse(processedString)

      for (const item of data) {
        entities.push({
          name: item[0],
          latitude: item[1],
          longitude: item[2],
        })
      }
      console.log('res-> ', entities[0])
    }
    jsonData.entities = entities
    // fs.writeFileSync(`../2024-1-done/${savename}.json`, JSON.stringify(jsonData, null, 2));
};

processScraping()
//script[10][3]