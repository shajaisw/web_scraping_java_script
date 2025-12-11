//import necessary modules and libraries
import fs from "fs";
import axios from "axios";
import * as cheerio from 'cheerio'
import fetch from "node-fetch";
import GeoJSON from 'geojson';
import fse from 'fs-extra';
import { v4 as uuidv4 } from "uuid"; // Import v4 function as uuidv4
import { dateformat } from '../scripts/date.js';

//update the following variables
const spider_name = "yifangtea_ph"
const start_urls = "https://yifangtea.com.ph/"
const brand_name = "YIFANG TAIWAN FRUIT TEA"
const spider_type = "chain"
const source = "DPA_SPIDERS"
const chain_id = "31349"
const chain_name = "YIFANG TAIWAN FRUIT TEA"
const categories = "100-1100-0010";
const foodtypes = null;

const processScraping = async () => {
  // Configure axios to ignore SSL certificate validation errors
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

  console.log('start fetching');
  let jsonData = {
    siteId: '136',
    chainName: 'YIFANG TAIWAN FRUIT TEA',
    ISO: 'PHL',
    SN: '31349',
    category: 'Coffee Shop',
    url: 'https://yifangtea.com.ph/location/',
    entities: []
  };

  let htmlString = ``;

  try {
    const res = await axios.get(jsonData.url);
    htmlString = res.data;
  } catch (error) {
    console.error("Error fetching the URL:", error);
    return;
  }

  const $ = cheerio.load(htmlString);
  let entities = [];

  $('.uc_post_grid_style_one_item').each((index, ele) => {
    const name = $(ele).find('.ue_p_title').text();
    const address = $(ele).find('.ue-meta-data').find('.ue-grid-item-meta-data').eq(0).text();
    const phone = $(ele).find('.ue-meta-data').find('.ue-grid-item-meta-data').eq(2).text();
    const workHours = $(ele).find('.ue-meta-data').find('.ue-grid-item-meta-data').eq(1).text().replace(/ - /g, ' – ');

    const modifiedWorkHours = workHours.replace(
      /(\d{1,2})(?::(\d{2}))?\s*(am|pm)\s*–\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)/gi,
      (match, p1, p2, p3, p4, p5, p6) => {
        const startHour = p1;
        const startMinutes = p2 ? p2 : '00';
        const startPeriod = p3;
        const endHour = p4;
        const endMinutes = p5 ? p5 : '00';
        const endPeriod = p6;

        return `${startHour}:${startMinutes} ${startPeriod} – ${endHour}:${endMinutes} ${endPeriod}`;
      }
    );

    entities.push({
      name: name.replace(/ – /g, '-'),
      phone: phone.trim(),
      workHours: convertHours(modifiedWorkHours.trim()),
      address: address.trim().replace(/ – /g, '-'),
    });
  });

  console.log('res-> ', entities[0]);
  jsonData.entities = entities;
  return jsonData.entities;
  // fs.writeFileSync(`../2024-1-done/yifangtea_ph.json`, JSON.stringify(jsonData, null, 2));
};

function convertHours(str){
  str = str.replace(/\n\s*/g, ', ');
  str = str.replace(/  \(/g, ' ');
  str = str.replace(/\(/g, '');
  str = str.replace(/\)/g, '');
  str = str.replace(/ – /g, '-');
  str = str.replace(/ –/g, '-');
  str = str.replace(/– /g, '-');
  str = str.replace(/ - /g, '-');
  str = str.replace(/ ,/g, ';');

  str = str.replace(/Monday/g, 'Mo');  
  str = str.replace(/Tuesday/g, 'Tu');
  str = str.replace(/Wednesday/g, 'We');
  str = str.replace(/Thursday/g, 'Th');
  str = str.replace(/Frs/g, 'Fr');
  str = str.replace(/Friday/g, 'Fr');
  str = str.replace(/Saturday/g, 'Sa');
  str = str.replace(/Sunday/g, 'Su');  

  //Convert Hours 
  str = str.replace(/(\d+):(\d+)\s*am/g, (match, p1, p2) => `${p1.padStart(2, '0')}:${p2}`);
  str = str.replace(/(\d+):(\d+)\s*pm/g, (match, p1, p2) => `${Number(p1) + 12}:${p2}`);

  return str;
}

//GeoCoding
const jsondata = await processScraping()

const date = new Date();
const dateformate =
  date.getFullYear() +
  ("0" + (date.getMonth() + 1)).slice(-2) +
  ("0" + date.getDate()).slice(-2) +
  "." +
  ("0" + date.getHours()).slice(-2) +
  ("0" + date.getMinutes()).slice(-2) +
  ("0" + date.getSeconds()).slice(-2);

const saveFile = "yifangtea_ph";
const country = "Philippines";

//remove duplicate
const uniqueData = jsondata.reduce((acc, curr) => {
  const existingItem = acc.find((item) => item.address === curr.address);
  if (!existingItem) {
    acc.push(curr);
  }
  return acc;
}, []);
        
const searchtext = uniqueData.map(prop => { return prop.address });
console.log(searchtext.length);
const apiKey = "1FjCffkxMB7b70TZ2-oBUFCp7qkdG7NWLKAbD1qk5Sg";

async function executeSearchTexts() {
const items = [];

for (const text of searchtext) {
  try {
    const url = `https://geocode.search.hereapi.com/v1/geocode?q=${text}&apiKey=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();

    const resultItem = data.items[0];
    const address2 = resultItem.address.label;
    const resultType = resultItem.resultType;
    let lat = null;
    let lng = null;

    // Check resultType and set lat/lng accordingly
    if (resultType === "place" || resultType === "houseNumber") {
      lat = resultItem.position.lat;
      lng = resultItem.position.lng;
    }

    const returnData = {
      address2,
      resultType,
      lat,
      lng,
    };

    items.push(returnData);
    } catch (error) {
      const returnData = {
      address2: "Not Found",
      resultType: "Not Found",
      lat: null,
      lng: null,
    };
    items.push(returnData);
    }
  }
  return items;
};

const returnResults = await executeSearchTexts();
console.log(returnResults);

// Modify the merging logic to ensure lat/lng are correctly handled
const mergedData = uniqueData.map((prop, index) => {
const result = returnResults[index];

// Conditionally set lat/lng based on resultType
const lat = (result.resultType === "place" || result.resultType === "houseNumber") ? result.lat : null;
const lng = (result.resultType === "place" || result.resultType === "houseNumber") ? result.lng : null;

return {
  ...prop,
  address2: result.address2,
  restultype: result.resultType,
  lat,
  lng,
  };
});

// Use mergedData for further processing
console.log(mergedData);

// Update latitudes and longitudes based on updatedLocations
const finalData = mergedData.map(prop => {               
  return prop;
});

const features = finalData.map(prop => {
  return {
    "addr:full": prop.address,
    "addr:street": prop.address,
    "addr:city": prop.city,
    "addr:state": prop.province,
    "addr:country": "Philippines",
    "addr:postcode": prop.postCode,
    "name": prop.name,
    "Id": prop.id || uuidv4(),
    "phones": { "store": [prop.phone] },
    "fax": { "store": prop.fax },
    "store_url": prop.url,
    "website": start_urls,
    "operatingHours": { "store": prop.workHours },
    "services": null,
    "chain_id": chain_id,
    "chain_name": chain_name,
    "brand": brand_name,
    "categories": categories,
    "foodtypes": foodtypes,
    "lat": prop.lat, // Ensure lat and lng are assigned from merged data
    "lng": prop.lng,
  };
});        

console.log("{ item_scraped_count:", features.length, "}");
const logfile = `{ "item_scraped_count": ${features.length} }`;
const outputGeojson = GeoJSON.parse(features, { Point: ['lat', 'lng'], removeInvalidGeometries: true });

const geoExp = JSON.stringify(outputGeojson);
fse.outputFileSync(`./output/${source}/${spider_name}/${dateformat}/${spider_name}.geojson`, geoExp);
fse.outputFileSync(`./output/${source}/${spider_name}/${dateformat}/${spider_name}_log.json`, logfile);
