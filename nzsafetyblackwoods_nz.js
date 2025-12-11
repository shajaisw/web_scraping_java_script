
//ohHold due to failing in geo coding while ingesting 

//import necessary modules and libraries
import axios from 'axios';
import fetch from 'node-fetch';
import GeoJSON from 'geojson';
import fse from 'fs-extra';
import * as cheerio from "cheerio";
import { v4 as uuidv4 } from "uuid"; // Import v4 function as uuidv4
import { dateformat } from '../scripts/date.js';

//update the following variables
const spider_name = "nzsafetyblackwoods_nz"
const start_urls = "https://nzsafetyblackwoods.co.nz/en/"
const brand_name = "Blackwoods Protector"
const spider_type = "chain"
const source = "DPA_SPIDERS"
const chain_id = "28518"
const chain_name = "Blackwoods Protector"
const categories = "600-6900-0096";
const foodtypes = null;

///////////////////////////////////////////////////////////////////////////////////////////////////////////////

const processScraping = async () => {
  // Configure axios to ignore SSL certificate validation errors
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

  const savename = "nzsafetyblackwoods_nz"
  console.log('start fetching')
  let jsonData = {
    siteId: '341',
    chainName: 'Blackwoods Protector',
    ISO: 'NZL',
    SN: '28518',
    category: 'Specialty Store',
    url: 'https://nzsafetyblackwoods.co.nz/en/stores',
    entities: []
  }

  let jsonString = ``
   let url = `https://nzsafetyblackwoods.co.nz/Common/GetTradecentres`

      const res = await fetch("https://nzsafetyblackwoods.co.nz/Common/GetTradecentres", {
        "headers": {
          "accept": "application/json, text/plain, */*",
          "accept-language": "en-US,en;q=0.9",
          "priority": "u=1, i",
          "sec-ch-ua": "\"Chromium\";v=\"124\", \"Google Chrome\";v=\"124\", \"Not-A.Brand\";v=\"99\"",
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": "\"Windows\"",
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-origin",
          "cookie": "Nop.customer=363dbf28-3b18-4379-9b14-9c8918fb830e; __RequestVerificationToken=5ggffCKOKqOPYRHzfvRkI-nkOVTkxmXdlS_xNXF3b5aQb1V14F_JPaJNt1qRe-BWsy0UxCjm9H5jAOTdm_jfp59mwS5JdAnrEByZqX6i0_41; account_id=259626601; __cf_bm=P6LEqqYQkGEtwPdKILw3QB18fssB5B6oYzfj0ML1pyU-1714291806-1.0.1.1-NTpxndNQ1Ru.4YWiriyGdh4VnXor1bJuvZ7ZhyM74KTfOecij.Va0tL1OFiSqAHlRY_Bx4exeREtWr_aUlHP0A; cf_clearance=pw5swgXowkeV4hrRwo2uxo8FGMJDstflJxXs.P7MNF0-1714291808-1.0.1.1-.eiTVnd9aUU9.aKun2_vJyqWp.sqRF_jfnCeMwS5J6T.k.gOKeYfhfly_HOjs9k8QTPM8ZUVzTkqAvblQyCaNQ",
          "Referer": "https://nzsafetyblackwoods.co.nz/en/stores",
          "Referrer-Policy": "strict-origin-when-cross-origin"
        },
        "body": null,
        "method": "POST"
      });
      jsonString = await res.text()
      const $ = cheerio.load(jsonString);



    const jsonDataString = JSON.parse(jsonString)
    console.log(jsonDataString)
    const dataString = jsonDataString.content
    const data = JSON.parse(dataString)
    let entities = []
    let count = 0
    for (const item of data) {
      //format address 
      const formattedAddress = `${item.address.StreetAddress} ${item.address.Suburb} ${item.address.city} ${item.address.Postcode}`;

      //format hours 
      const hours = item.tradingHours.map(hour => `${hour.day} ${hour.openingTime}-${hour.closingTime}`);
      const convertedHours  = hours.map(hour  =>  convertHours(hour));

      entities.push({
        name: item.name,
        address: formattedAddress,
        phone : item.telephone,
        workHours : convertedHours,
        latitude: item.latitude,
        longitude: item.longitude,
        city  : item.address.city,
        postal_code :  item.address.Postcode
      })
    }

    console.log('res-> ', entities[0])
    jsonData.entities = entities;

    return jsonData.entities;
    //fs.writeFileSync(`../2024-1-done/${savename}.json`, JSON.stringify(jsonData, null, 2));
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

  //Convert Hours 
  str = str.replace(/(\d+):(\d+)\s*am/g, (match, p1, p2) => `${p1.padStart(2, '0')}:${p2}`);
  str = str.replace(/(\d+):(\d+)\s*pm/g, (match, p1, p2) => `${Number(p1) + 12}:${p2}`);

  return str;
}


///////////////////////////////////////////////////////////////////////////////////////////////////////
//call function processScraping
const finalData = await processScraping('nzsafetyblackwoods_nz');

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

