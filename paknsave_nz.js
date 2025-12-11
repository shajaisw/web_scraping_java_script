//import necessary modules and libraries
import axios from 'axios';
import fetch from 'node-fetch';
import GeoJSON from 'geojson';
import fse from 'fs-extra';
import * as cheerio from "cheerio";
import { v4 as uuidv4 } from "uuid"; // Import v4 function as uuidv4
import { dateformat } from '../scripts/date.js';

//update the following variables
const spider_name = "paknsave_nz"
const start_urls = "https://www.paknsave.co.nz/"
const brand_name = "PAK'nSAVE Fuel"
const spider_type = "chain"
const source = "DPA_SPIDERS"
const chain_id = "23839"
const chain_name = "PAK'nSAVE Fuel"
const categories = "700-7600-0116";
const foodtypes = null;

///////////////////////////////////////////////////////////////////////////////////////////////////////////////

const processScraping = async () => {
  // Configure axios to ignore SSL certificate validation errors
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

  const savename = "paknsave_nz"
  console.log('start fetching')
  let jsonData = {
    siteId: '348',
    chainName: 'PAK\'nSAVE Fuel',
    ISO: 'NZL',
    SN: '23839',
    category: 'Petrol-Gasoline Station',
    url: 'https://www.paknsave.co.nz/store-finder',
    entities: []
  }

  let jsonString = ``
  let url = `https://www.paknsave.co.nz/BrandsApi/BrandsStore/GetBrandStores`

  const res = await fetch(url)
  jsonString = await res.text()

const data = JSON.parse(jsonString)
    let entities = []
    let count = 0
    for (const item of data) {
      entities.push({
        id : item.id,
        name: item.name,
        address: item.address,
        workHours : convertHours(item.openingHours),
        latitude: item.latitude,
        longitude: item.longitude
      })
    }

    console.log('res-> ', entities[0])
    jsonData.entities = entities;

    return jsonData.entities;
    // fs.writeFileSync(`../2024-1-done/${savename}.json`, JSON.stringify(jsonData, null, 2));
};

///////////////////////////////////////////////////////////////////////////////////////////////////////
//function to convert hours 
function convertHours(str){
  str = str.replace(/\;/g, ' ');
  str = str.replace(/\./g, ':');

  //format days of weeks 
  str = str.replace("Monday-", 'Mo ');
  str = str.replace("Tuesday-", 'Tu ');
  str = str.replace("Wednesday-", 'We ');
  str = str.replace("Thursday-", 'Th ');
  str = str.replace("Friday-", 'Fr ');
  str = str.replace("Saturday-", 'Sa ');
  str = str.replace("Sunday-", 'Su ');

  //Convert Hours 
  str = str.replace(/(\d+):(\d+)\s*am/g, (match, p1, p2) => `${p1.padStart(2, '0')}:${p2}`);
  str = str.replace(/(\d+):(\d+)\s*pm/g, (match, p1, p2) => `${Number(p1) + 12}:${p2};`);

  return str;
}

///////////////////////////////////////////////////////////////////////////////////////////////////////
//call function processScraping
const finalData = await processScraping('paknsave_nz');

//process json data into geojson format for spider platform
const features = finalData.map( prop => {
    return {
            "addr:full":prop.address,
            "addr:street":prop.street,
            "addr:city":prop.city,
            "addr:state":prop.state,
            "addr:country":"New Zealand",
            "addr:postcode":prop.postal_code,
            "name":prop.name,
            "Id":prop.id || uuidv4(),
            "phones":{
                "store":[prop.phone]},
            "fax":{"store":null},
            "store_url":prop.url,
            "website":start_urls,
            "operatingHours":{"store":prop.workHours},
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

