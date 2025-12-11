//import necessary modules and libraries
import fs from "fs";
import axios from "axios";
import fetch from "node-fetch";
import GeoJSON from 'geojson';
import fse from 'fs-extra';
import { v4 as uuidv4 } from "uuid"; // Import v4 function as uuidv4
import { dateformat } from '../../scripts/date.js';

//update the following variables
const spider_name = "angelspizza_ph"
const start_urls = "https://www.angelspizza.com.ph/"
const brand_name = "ANGEL'S PIZZA"
const spider_type = "chain"
const source = "DPA_SPIDERS"
const chain_id = "35954"
const chain_name = "ANGEL'S PIZZA"
const categories = "100-1000-0009";
const foodtypes = "800-057";

const processScraping = async () => {
  // Configure axios to ignore SSL certificate validation errors
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

  const savename = 'angelspizza_ph'
  console.log('start fetching')
  let jsonData = {
    siteId: '132',
    chainName: "ANGEL'S PIZZA",
    ISO: 'PHL',
    SN: '100-1000-0009',
    category: 'Pizza',
    url: 'https://www.angelspizza.com.ph/locations',
    entities: []
  }
  let jsonString = ``
  let urls = [`https://api.angelspizza.com.ph/api/province-branches-for-location-page?page=1`,
              `https://api.angelspizza.com.ph/api/province-branches-for-location-page?page=2`,
              `https://api.angelspizza.com.ph/api/province-branches-for-location-page?page=3`]

    let allData = []

      for (const url of urls) {
        const res = await axios.get(url)
        jsonString = res.data
        allData.push(jsonString)
      }
      const dataFinal = []

      for (const data of allData) {
        
            const dataRaw = data.included
            console.log('data-> ', dataRaw)
              let count = 0
              const entities = []

              for (const item of dataRaw) {
                if (item.type == "branches-location" ) {
                  const name = item.attributes.title;
                  const phone = item.attributes.contact;
                  const address = item.attributes.address;
                  const latitude = item.attributes.latitude;
                  const longitude = item.attributes.longitude;
                  const hours = item.attributes.schedules[0] || '';
                  const hours1 = item.attributes.schedules[1] || '';
                  const workHours = `${hours}, ${hours1}`;

                  entities.push({
                    name: name,
                    phone: phone,
                    address: address.replace(/\r\n/g, ' '),
                    workHours: convertHours(workHours),
                    latitude: latitude,
                    longitude: longitude,
                  })
                }
              }
            dataFinal.push(entities)

      }
// console.log('res-> ', dataFinal.length)
// console.log('res-> ', dataFinal[0])
jsonData.entities = dataFinal.flat()

return jsonData.entities;
// fs.writeFileSync(`../2024-1-done/${savename}_real.json`, JSON.stringify(jsonData, null, 2));

};

function convertHours(str){
  str = str.replace(/ to /g, '-');
  str = str.replace(/ - /g, '-');
  str = str.replace(/, $/g, '');

  str = str.replace(/Monday/g, 'Mo');  
  str = str.replace(/Tuesday/g, 'Tu');
  str = str.replace(/Wednesday:/g, 'We');
  str = str.replace(/Wednesday/g, 'We');
  str = str.replace(/Thursday:/g, 'Th');
  str = str.replace(/Thursday/g, 'Th');
  str = str.replace(/Friday/g, 'Fr');
  str = str.replace(/Saturday/g, 'Sa');
  str = str.replace(/Sunday:/g, 'Su');
  str = str.replace(/Sunday/g, 'Su');

  str = str.replace(/Midnight/g, '12:00AM');

  // //Convert Hours 
  str = str.replace(/(\d+):(\d+)\s*AM/g, (match, p1, p2) => `${p1.padStart(2, '0')}:${p2}`);
  str = str.replace(/(\d+):(\d+)\s*PM/g, (match, p1, p2) => `${Number(p1) + 12}:${p2}`);

  return str;
}

//call function processScraping
const finalData = await processScraping();

//process json data into geojson format for spider platform
const features = finalData.map( prop => {
    return {
            "addr:full":prop.address,
            "addr:street":prop.street,
            "addr:city":prop.city,
            "addr:state":prop.state,
            "addr:country":"Philippines",
            "addr:postcode":prop.zip,
            "name":prop.name,
            "Id":prop.id || uuidv4(),
            "phones":{
                "store":[prop.phone]},
            "fax":{"store":null},
            "store_url":prop.url,
            "website":start_urls,
            "operatingHours":{"store": prop.workHours},
            "services": prop.services || null,
            "chain_id": chain_id,
            "chain_name": chain_name,
            "brand": brand_name,
            "categories":categories,
            "foodtypes":foodtypes,
            "lat":prop.latitude,
            "lng":prop.longitude ,
        }
    
  });
  console.log ("{ item_scraped_count:" , features.length,"}")
  const logfile = `{ "item_scraped_count": ` +features.length + " }"
  const outputGeojson = GeoJSON.parse(features,{Point:['lat','lng'],removeInvalidGeometries:true});
      
  const geoExp = JSON.stringify(outputGeojson)
  fse.outputFileSync(`./output/${source}/${spider_name}/${dateformat}/${spider_name}.geojson`,geoExp)
  fse.outputFileSync(`./output/${source}/${spider_name}/${dateformat}/${spider_name}_log.json`,logfile)
