//import necessary modules and libraries
import axios from "axios";
import * as cheerio from 'cheerio'
import GeoJSON from 'geojson';
import fse from 'fs-extra';
import { v4 as uuidv4 } from "uuid"; // Import v4 function as uuidv4
import { dateformat } from '../../scripts/date.js';

//update the following variables
const spider_name = "wilcon_ph"
const start_urls = "https://shop.wilcon.com.ph/"
const brand_name = "Wilcon Depot"
const spider_type = "chain"
const source = "DPA_SPIDERS"
const chain_id = "35872"
const chain_name = "Wilcon Depot"
const categories = "600-6600-0077";
const foodtypes = null;

//////////////////////////////////////////////////////////////////////////////////////

const processScraping = async () => {
  // Configure axios to ignore SSL certificate validation errors
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  
  const savename = "wilcon_ph"
  console.log('start fetching')
  let jsonData = {
    siteId: '296',
    chainName: 'Wilcon Depot',
    ISO: 'PHL',
    SN: '35872',
    category: 'Home Improvement-Hardware Store',
    url: 'https://shop.wilcon.com.ph/stores/',
    entities: []
  }

  let htmlString = ``
  let entities = []
  let count = 0

  let url = `https://shop.wilcon.com.ph/kslocator/index/ajax/`

 
      const res = await fetch(url)
      htmlString = await res.text()
      const dataString = JSON.parse(htmlString)
      const jsonString = JSON.stringify(dataString.items)
      const data = JSON.parse(jsonString)
      for (const item of data) {
        const dirtyJson = item.schedule;
        const cleanObject = JSON.parse(dirtyJson);
        const cleanJson = JSON.stringify(cleanObject, null, 2);

        // Extracting and formatting work hours
        const workHours = Object.entries(cleanObject).map(([day, time]) => {
          const from = time.from.join(":");
          const to = time.to.join(":");
          return `${day} ${from}-${to}`;
        });

        entities.push({
          id : item.id,
          name: item.name,
          city: item.city,
          address : item.address,
          phone : item.phone,
          email : item.email,
          website : item.website,
          latitude: item.lat,
          longitude : item.lng,
          postCode : item.zip,
          workHours : convertDays(workHours.join('; ')),
        })
      }
    

    console.log('res-> ', entities[0])
    jsonData.entities = entities

    return jsonData.entities;
    // fs.writeFileSync(`../2024-1-done/${savename}.json`, JSON.stringify(jsonData, null, 2));
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//function for days of week 
function convertDays(str){

  str = str.replace(/monday/g, 'Mo');
  str = str.replace(/tuesday/g, 'Tu');
  str = str.replace(/wednesday/g, 'We');
  str = str.replace(/thursday/g, 'Th');
  str = str.replace(/friday/g, 'Fr');
  str = str.replace(/saturday/g, 'Sa');
  str = str.replace(/sunday/g, 'Su');

  return str;
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//call function processScraping
const finalData = await processScraping('wilcon_ph');

//process json data into geojson format for spider platform
const features = finalData.map( prop => {
    return {
            "addr:full":prop.address,
            "addr:street":prop.street,
            "addr:city":prop.city,
            "addr:state":prop.state,
            "addr:country":"Philippines",
            "addr:postcode":prop.postCode,
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
