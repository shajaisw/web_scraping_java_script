//import necessary modules and libraries
import axios from 'axios';
import fetch from 'node-fetch';
import GeoJSON from 'geojson';
import fse from 'fs-extra';
import * as cheerio from "cheerio";
import { v4 as uuidv4 } from "uuid"; // Import v4 function as uuidv4
import { dateformat } from '../../scripts/date.js';

//update the following variables
const spider_name = "2degrees_nz"
const start_urls = "https://www.2degrees.nz/"
const brand_name = "2degrees"
const spider_type = "chain"
const source = "DPA_SPIDERS"
const chain_id = "28503"
const chain_name = "2degrees"
const categories = "700-7100-0000";
const foodtypes = null;

///////////////////////////////////////////////////////////////////////////////////////////////////////////////

const processScraping = async () => {
  // Configure axios to ignore SSL certificate validation errors
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  
  const savename = "2degrees_nz"
  console.log('start fetching')
  let jsonData = {
    siteId: '347',
    chainName: '2degrees',
    ISO: 'NZL',
    SN: '28503',
    category: 'Communication-Media',
    url: 'https://www.2degrees.nz/store-locator',
    entities: []
  }

  let jsonString = ``
  let url = `https://www.2degrees.nz/restful/v1/storelocator/stores`

      const res = await fetch(url)
      jsonString = await res.text()

    const data = JSON.parse(jsonString)
    let entities = []
    let count = 0
    for (const item of data) {
      const hours = item.openingHours
      // Extracting and formatting opening hours for each day
      const formattedHours = Object.entries(hours).map(([day, times]) => {
        return `${day.charAt(0).toUpperCase() + day.slice(1)} ${times.open}-${times.close}`;
      });

      // Joining formatted hours into a string
      const openingHoursString = formattedHours.join('; ');
      entities.push({
        id: item.id,
        name: item.name,
        address: item.address,
        phone : item.contactDetails,
        workHours : convertHours(openingHoursString),
        latitude: item.latitude,
        longitude: item.longitude,
        types: item.type,
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
  //format days of weeks 
  str = str.replace("Monday", 'Mo');
  str = str.replace("Tuesday", 'Tu');
  str = str.replace("Wednesday", 'We');
  str = str.replace("Thursday", 'Th');
  str = str.replace("Friday", 'Fr');
  str = str.replace("Saturday", 'Sa');
  str = str.replace("Sunday", 'Su');

  return str;
}
///////////////////////////////////////////////////////////////////////////////////////////////////////
//call function processScraping
const finalData = await processScraping('2degrees_nz');

//using filter to fetch branch data 
const filterType = finalData.filter(prop => prop.types === "2degrees");

//process json data into geojson format for spider platform
const features = filterType.map( prop => {
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


