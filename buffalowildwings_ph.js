
//onHold 

//import necessary modules and libraries
import axios from "axios";
import * as cheerio from 'cheerio'
import GeoJSON from 'geojson';
import fse from 'fs-extra';
import { v4 as uuidv4 } from "uuid"; // Import v4 function as uuidv4
import { dateformat } from '../scripts/date.js';

//update the following variables
const spider_name = "buffalowildwings_ph"
const start_urls = "https://www.buffalowildwings.ph/"
const brand_name = "Buffalo Wild Wings"
const spider_type = "chain"
const source = "DPA_SPIDERS"
const chain_id = "1497"
const chain_name = "Buffalo Wild Wings"
const categories = "100-1000-0001";
const foodtypes = "101-000";

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const processScraping = async () => {
  // Configure axios to ignore SSL certificate validation errors
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

  const savename = "buffalowildwings_ph"
  console.log('start fetching')
  let jsonData = {
    siteId: '168',
    chainName: 'Buffalo Wild Wings',
    ISO: 'PHL',
    SN: '1497',
    category: 'Casual Dining',
    url: 'https://www.buffalowildwings.ph/branch',
    entities: []
  }

  let htmlString = ``

      const res = await axios.get(jsonData.url)
      htmlString = res.data

    const $ = cheerio.load(htmlString);
    let entities = []
    let count = 0

    $('.location').each((index, ele) => {
      const name = $(ele).find('.right-column-location').find('h2').text()
      const address = $(ele).find('.right-column-location').find('p').eq(0).text()
      const phone = $(ele).find('.right-column-location').find('p').eq(1).text()
      const latitude = $(ele).find('.form-two-col').find('input').eq(0).attr('value')
      const longitude = $(ele).find('.form-two-col').find('input').eq(1).attr('value')
      const hours = $(ele).find('p.description').text()

      entities.push({
        name: name,
        phone: phone.trim().replace(/\|/g, ', '),
        address: address.trim(),
        latitude: latitude,
        longitude: longitude,
        workHours : convertHours(hours)
      })
    })

    console.log('res-> ', entities[0])

    jsonData.entities = entities;
    return jsonData.entities;
// fs.writeFileSync(`../2024-1-done/${savename}.json`, JSON.stringify(jsonData, null, 2));
};

/////////////////////////////////////////////////////////////////////////////////////////////////
//function to convert hours 
function convertHours(str){
  //special Cases
  str = str.replace(/\|/g, '');
  str = str.replace(/   /g, ' ');
  str = str.replace(/  /g, ' ');
  str = str.replace(/ to /g, '-');
  
  str = str.replace(/AM/g, "am");
  str = str.replace(/PM/g, "pm");
  
  //days format
  str = str.replace(/Mon :/g, "Mo");
  str = str.replace(/Mon/g, "Mo");
  str = str.replace(/Tue/g, "Tu");
  str = str.replace(/Wed/g, "We");
  str = str.replace(/Thurs:/g, "Th");
  str = str.replace(/Thurs/g, "Th");
  str = str.replace(/Friday/g, "Fr");
  str = str.replace(/Fri/g, "Fr");
  str = str.replace(/Saturday/g, "Sa");
  str = str.replace(/Sat:/g, "Sa");
  str = str.replace(/Sat/g, "Sa");
  str = str.replace(/Sun/g, "Su");

  //convert hours to 9am - 10pm o 9:00am - 10:00pm
  str = str.replace(/(\d{1,2})\s*(am|pm)-(\d{1,2})\s*(am|pm)/g, '$1:00$2-$3:00$4');

  //convert hours
  str = str.replace(/(\d+):(\d+)\s*am/g, (match, p1, p2) => `${p1.padStart(2, '0')}:${p2}`);
  str = str.replace(/(\d+):(\d+)\s*pm/g, (match, p1, p2) => `${Number(p1) + 12}:${p2};`);

  str = str.replace(/;$/g, '');

  return str;
};

/////////////////////////////////////////////////////////////////////////////////////////////////
//call function processScraping
const finalData = await processScraping('buffalowildwings_ph');

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



