//import necessary modules and libraries
import axios from "axios";
import * as cheerio from 'cheerio'
import GeoJSON from 'geojson';
import fse from 'fs-extra';
import { v4 as uuidv4 } from "uuid"; // Import v4 function as uuidv4
import { dateformat } from '../scripts/date.js';

//update the following variables
const spider_name = "shopmetro_ph"
const start_urls = "https://shopmetro.ph/"
const brand_name = "Shop Metro"
const spider_type = "chain"
const source = "DPA_SPIDERS"
const chain_id = "2825"
const chain_name = "Shop Metro"
const categories = "600-6900-0098";
const foodtypes = null;

//////////////////////////////////////////////////////////////////////////////////////

const processScraping = async () => {
  // Configure axios to ignore SSL certificate validation errors
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

  const savename = 'shopmetro_ph'
  console.log('start fetching')
  let jsonData = {
    siteId: '282',
    chainName: 'Shop Metro',
    ISO: 'PHL',
    SN: '2825',
    category: 'Wholesale Store',
    url: 'https://shopmetro.ph/',
    entities: []
  }

  let jsonString = ``
  let url = `https://shopmetro.ph/wp-content/uploads/agile-store-locator/locator-data.json?v=1&action=asl_load_stores&nonce=683f82cf8e&load_all=1&layout=0`

      const res = await axios.get(url)
      jsonString = res.data


    const data = jsonString
    let entities = []
    let count = 0
    for (const item of data) {
      let hours;
      try {
          // Parse the opening hours
          hours = JSON.parse(item.open_hours);
          // Format the opening hours
          let formattedHours = '';
          for (const day in hours) {
              formattedHours += `${day.substring(0, 2)} ${hours[day][0]}; `;
          }
          // Assign formatted hours to the entity
          item.workHours = formattedHours;
      } catch (error) {
          // Handle the error, maybe log it or provide a default value
          console.error("Error parsing or formatting open hours JSON:", error);
          // Provide a default value if parsing or formatting fails
          item.workHours = ''; 
      }

      entities.push({
        id: item.id,
        name: item.title,
        phone: item.phone,
        email: item.email,
        fax : item.fax,
        website : item.website,
        address: item.street,
        city : item.city,
        latitude: item.lat,
        longitude: item.lng,
        workHours : convertDayToTwoLetters(item.workHours),
      })
    }

    console.log('res-> ', entities[0])

    jsonData.entities = entities;

    return jsonData.entities;
// fs.writeFileSync(`../2024-1-done/${savename}.json`, JSON.stringify(jsonData, null, 2));
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Define a function to convert day abbreviations to two-letter abbreviations

function convertDayToTwoLetters(str) {
  str = str.replace(/mo/g, "Mo");
  str = str.replace(/tu/g, "Tu");
  str = str.replace(/we/g, "We");
  str = str.replace(/th/g, "Th");
  str = str.replace(/fr/g, "Fr");
  str = str.replace(/sa/g, "Sa");
  str = str.replace(/su/g, "Su");

  //Convert Hours 
  str = str.replace(/(\d+):(\d+)\s*AM/g, (match, p1, p2) => `${p1.padStart(2, '0')}:${p2}`);
  str = str.replace(/(\d+):(\d+)\s*PM/g, (match, p1, p2) => `${Number(p1) + 12}:${p2}`);

  str = str.replace(/; $/g,'');

return str;
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//call function processScraping
const finalData = await processScraping('shopmetro_ph');

//process json data into geojson format for spider platform
const features = finalData.map( prop => {
    return {
            "addr:full":prop.address,
            "addr:street":prop.street,
            "addr:city":prop.city,
            "addr:state":prop.state,
            "addr:country":"Philippines",
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

