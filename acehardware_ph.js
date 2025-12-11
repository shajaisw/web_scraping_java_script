//import necessary modules and libraries
import axios from "axios";
import * as cheerio from 'cheerio'
import GeoJSON from 'geojson';
import fse from 'fs-extra';
import { v4 as uuidv4 } from "uuid"; // Import v4 function as uuidv4
import { dateformat } from '../scripts/date.js';

//update the following variables
const spider_name = "acehardware_ph"
const start_urls = "https://www.acehardware.ph/"
const brand_name = "Ace Hardware"
const spider_type = "chain"
const source = "DPA_SPIDERS"
const chain_id = "6106"
const chain_name = "Ace Hardware"
const categories = "600-6600-0077";
const foodtypes = null;

/////////////////////////////////////////////////////////////////////////////////////

const processScraping = async () => {
  // Configure axios to ignore SSL certificate validation errors
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

  const savename = "acehardware_ph"
  console.log('start fetching')
  let jsonData = {
    siteId: '295',
    chainName: 'Ace Hardware',
    ISO: 'PHL',
    SN: '6106',
    category: 'Home Improvement-Hardware Store',
    url: 'https://www.acehardware.ph/pages/store-locator',
    entities: []
  }

  let htmlString = ``
  let entities = []
  let count = 0

  let url = `https://www.acehardware.ph/cdn/shop/t/6/assets/locations.json?v=112120423751510550221708996098&origLat=14.541026643951675&origLng=120.98339929788827&origAddress=15th+Floor%2C+Four+E-Com+Center%2C+East+Tower+Mall+of+Asia+Complex%2C+J.W.+Diokno+Blvd%2C+Pasay%2C+Metro+Manila%2C+Philippines&formattedAddress=&boundsNorthEast=&boundsSouthWest=`
    const res = await axios.get(url);
    htmlString = res.data;
    
    //  code in here

    const data = htmlString
    for (const item of data) {
      // fetch all data phone
      const phone1 = item.phone1;
      const phone2 = item.phone2;
      const phone3 = item.phone3;
      const phone4 = item.phone4;
      const phone5 = item.phone5;
      const phoneData = (phone1 + ", " + phone2 + ", " + phone3 + ", " + phone4 + ", " + phone5)
                        .replace(/, , , , $/g, '')
                        .replace(/, , , $/g, '')
                        .replace(/, , $/g, '')
                        .replace(/, $/g, '')
                        .replace(/,$/g, '');

      // for hours-Minutes Conversion 
      const modifiedWorkHours = item.hours1.replace(
        /(\d{1,2})(am|pm)-(\d{1,2})(am|pm)|(\d{1,2})(am|pm)-(\d{1,2}):(\d{2})(am|pm)|(\d{1,2}:\d{2})(am|pm)-(\d{1,2})(am|pm)/g,
        (match, p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11, p12, p13) => {
            if (p1 && p3) {
                // Case: 8am-8pm
                return `${p1}:00${p2}-${p3}:00${p4}`;
            } else if (p5 && p7) {
                // Case: 8am-8:30pm
                return `${p5}:00${p6}-${p7}:${p8}${p9}`;
            } else if (p10 && p12) {
                // Case: 8:30am-8pm
                return `${p10}${p11}-${p12}:00${p13}`;
            }
        }
      );    

      entities.push({
        id : item.id,
        name: item.name,
        city: item.city,
        state : item.state,
        address : item.address,
        phone : phoneData,
        email : item.email,
        website : item.web,
        postal_code : item.postal,
        latitude: item.lat,
        longitude : item.lng,
        workHours : convertHours(modifiedWorkHours),
      })
    }
  
  console.log('res-> ', entities[0])

  jsonData.entities = entities

  return jsonData.entities;
  // fs.writeFileSync(`../2024-1-done/${savename}.json`, JSON.stringify(jsonData, null, 2));

};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//function to convert hours 
function convertHours(str){
  // Convert days of weeks 
  str = str.replace(/Mon-Sun/g, "Mo-Su");

  //Convert Hours 
  str = str.replace(/(\d+):(\d+)\s*am/g, (match, p1, p2) => `${p1.padStart(2, '0')}:${p2}`);
  str = str.replace(/(\d+):(\d+)\s*pm/g, (match, p1, p2) => `${Number(p1) + 12}:${p2}`);

  return str;
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//call function processScraping
const finalData = await processScraping('acehardware_ph');

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



