//import necessary modules and libraries
import fetch from "node-fetch";
import GeoJSON from 'geojson';
import fse from 'fs-extra';
import { v4 as uuidv4 } from "uuid"; // Import v4 function as uuidv4
import { dateformat } from '../../scripts/date.js';

//update the following variables
const spider_name = "boscoffee_ph"
const start_urls = "https://www.boscoffee.com/"
const brand_name = "Bo's Coffee"
const spider_type = "chain"
const source = "DPA_SPIDERS"
const chain_id = "8671"
const chain_name = "Bo's Coffee"
const categories = "100-1100-0010";
const foodtypes = null;

const processScraping = async () => {
  // Configure axios to ignore SSL certificate validation errors
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

  const savefile = 'boscoffee_ph'
  console.log('start fetching')
  let jsonData = {
      siteId: '107',
      chainName: "Bo's Coffee",
      ISO: 'PHL',
      SN: '100-1100-0010',
      category: 'Coffee Shop',
      url: 'https://www.boscoffee.com/a/storelocator',
      entities: []
  }

  let htmlString = ``

  const res = await fetch("https://storelocator.metizapps.com/stores/storeDataGet", {
    "headers": {
      "accept": "application/json, text/javascript, */*; q=0.01",
      "accept-language": "en-US,en;q=0.9",
      "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
      "priority": "u=0, i",
      "sec-ch-ua": "\"Google Chrome\";v=\"125\", \"Chromium\";v=\"125\", \"Not.A/Brand\";v=\"24\"",
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": "\"Windows\"",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "cross-site"
    },
    "referrer": "https://www.boscoffee.com/",
    "referrerPolicy": "strict-origin-when-cross-origin",
    "body": "shopData=bos-coffee.myshopify.com",
    "method": "POST",
    "mode": "cors",
    "credentials": "omit"
  });

  htmlString = await res.json();
  console.log('htmlString-> ', htmlString)
  
  const dataRaw = htmlString.data.result
  let entities = []

  for (let i = 0; i < dataRaw.length; i++) {
    const id = dataRaw[i].shop_id
    const name = dataRaw[i].storename
    const city = dataRaw[i].cityname
    const zip = dataRaw[i].zipcode
    const phone = dataRaw[i].phone
    const address = dataRaw[i].address
    const state = dataRaw[i].statename
    const hours = dataRaw[i].hour_of_operation
    const coordinates = {
        latitude: dataRaw[i].mapLatitude,
        longitude: dataRaw[i].mapLongitude
    }

    entities.push({
        id: id,
        name: name,
        city: city,
        zip: zip,
        state: state,
        hours: convertHours(hours),
        phone: phone,
        address: address.trim(),
        latitude: coordinates.latitude,
        longitude: coordinates.longitude
    })
  }
   console.log('res-> ', entities[0])
  jsonData.entities = entities

  return jsonData.entities;
// fs.writeFileSync(`../2024-1-done/${savefile}.json`, JSON.stringify(jsonData, null, 2));
};

function convertHours(str){
  str = str.replace(/\<\/br\>\<\/br\>/g, ' ');
  // str = str.replace(/<\/br>/g, ' ');
  str = str.replace(/ - /g, '-');
  str = str.replace(/  -/g, '-');
  // str = str.replace(/\s*-\s*/g, ' - ');

  str = str.replace(/24 Hours/g, '00:00AM-12:00PM');

  // Regex to match and rearrange the hours and days
  const regex = /(\d{1,2}:\d{2}\s*[AP]M)\s*-\s*(\d{1,2}:\d{2}\s*[AP]M)\s*-\s*(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)/g;
  str = str.replace(regex, '$3 $1-$2;');

  // Remove any trailing semicolon and spaces
  str = str.trim().replace(/;$/, '');

  str = str.replace(/Monday/g, 'Mo');  
  str = str.replace(/Tuesday/g, 'Tu');
  str = str.replace(/Wednesday/g, 'We');
  str = str.replace(/Thursday/g, 'Th');
  str = str.replace(/Friday/g, 'Fr');
  str = str.replace(/Saturday/g, 'Sa');
  str = str.replace(/Sunday/g, 'Su');

  str = str.replace(/12:00 -10:00 PM/g, '');
  str = str.replace(/1:00 -11:00 PM/g, '');
  str =str.replace(/-Mo -Tu -We -Th -Fr -Sa -Su/g, '');
  
  //Convert Hours 
  str = str.replace(/(\d+):(\d+)\s*AM/g, (match, p1, p2) => `${p1.padStart(2, '0')}:${p2}`);
  str = str.replace(/(\d+):(\d+)\s*PM/g, (match, p1, p2) => `${Number(p1) + 12}:${p2}`);

  str = str.replace(/0700H-2400H/g, '07:00-24:00');

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
            "operatingHours":{"store": prop.hours},
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

  //hours not pesent on website hours : ""
  //Qatar - Pearl Medina
  //Qatar - RAMADA
  //Qatar - MOQ
  //Qatar Bin Omran
  //Qatar Red Line DECC Station
  //Qatar Umm Ghuwailina