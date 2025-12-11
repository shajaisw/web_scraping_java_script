//import necessary modules and libraries
import axios from "axios";
import fetch from "node-fetch";
import * as cheerio from 'cheerio'
import GeoJSON from 'geojson';
import fse from 'fs-extra';
import { v4 as uuidv4 } from "uuid"; // Import v4 function as uuidv4
import { dateformat } from '../scripts/date.js';

//update the following variables
const spider_name = "themarketplace_ph"
const start_urls = "https://themarketplace.com.ph/"
const brand_name = "THE MARKETPLACE"
const spider_type = "chain"
const source = "DPA_SPIDERS"
const chain_id = "35957"
const chain_name = "THE MARKETPLACE"
const categories = "600-6300-0066";
const foodtypes = null;

const processScraping = async () => {
  // Configure axios to ignore SSL certificate validation errors
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

  const savename = 'themarketplace_ph';
  console.log('start fetching');
  let jsonData = {
    siteId: '291',
    chainName: 'THE MARKETPLACE',
    ISO: 'PHL',
    SN: '600-6300-0066',
    category: 'Grocery',
    url: 'https://themarketplace.com.ph/our-stores',
    entities: []
  };

  let htmlString = ``;

  try {
    const res = await axios.get(jsonData.url);
    htmlString = res.data;
  } catch (error) {
    console.error('Error fetching the URL:', error);
    return;
  }

  const $ = cheerio.load(htmlString);

  let entities = [];

  $('.list').each((index, ele) => {
    const name = $(ele).find('.list_title').text().trim();
    let entity = {};

    if (name === "TMP WESTBOROUGH SILANG" || name === "MAGNOLIA" || name === "PARQAL" || name === "WESTBOROUGH SILANG") {
      const address = $(ele).find('.info').eq(0).find('p').text().trim();
      const phone = $(ele).find('.info').eq(1).find('div').text().trim();
      const email = $(ele).find('.info').eq(2).find('div').text().trim();
      const workHours = $(ele).find('.info').eq(3).find('div').text().trim();      

      // Only include non-empty properties
      if (name) entity.name = name;
      if (phone) entity.phone = phone.replace(email, '');
      if (email) entity.email = email.replace(workHours, '');
      if (workHours) entity.workHours = convertHours(workHours);
      if (address) entity.address = address;
    } else {
      const address = $(ele).find('.info').eq(0).find('p').text().trim();
      const mobile = $(ele).find('.info').eq(1).find('div').text().trim();
      const phone = $(ele).find('.info').eq(2).find('div').text().trim();
      const phones = `${mobile}, ${phone}`.replace(/,\s*$/, '');
      const email = $(ele).find('.info').eq(3).find('div').text().trim();
      const workHours = $(ele).find('.info').eq(4).find('div').text().trim();      

      // Only include non-empty properties
      if (name) entity.name = name;
      if (phones) entity.phone = phones.replace(email, '');
      if (email) entity.email = email;
      if (workHours) entity.workHours = convertHours(workHours);
      if (address) entity.address = address;
    }

    // Only add the entity if it has at least one non-empty property
    if (Object.keys(entity).length > 0) {
      entities.push(entity);
    }
  });

  console.log('res-> ', entities[0]);

  jsonData.entities = entities;

  return jsonData.entities;
};

function convertHours(str){
  str = str.replace(/ to /g, '-');
  str = str.replace(/^/g, 'Mo-Su ');
  str = str.replace(/ & /g, '-');

  str = str.replace(/Mon/g, 'Mo');
  str = str.replace(/Mo-Su Mo-Thu -/g, 'Mo-Th');
  str = str.replace(/Mo-Su Sun-Th -/g, 'Su-Th');
  str = str.replace(/Sat -/g, 'Sa');
  str = str.replace(/Fri/g, 'Fr');
  str = str.replace(/Sat/g, 'Sa');
  str = str.replace(/Sun/g, 'Su');

  str = str.replace(/WE -/g, 'Sa-Su');
  str = str.replace(/Mo-Su WD -/g, 'Mo-Fr');
  str = str.replace(/Mo-Su Weekdays -/g, 'Mo-Fr');
  str = str.replace(/Weekends -/g, 'Sa-Su');
  str = str.replace(/ and holiday -/g, ', PH');

  str = str.replace(/am/g, 'AM');
  str = str.replace(/Am/g, 'AM');
  str = str.replace(/pm/g, 'PM');

  str = str.replace(/ - /g, '-');


  //Convert Hours 
  str = str.replace(/(\d+):(\d+)\s*AM/g, (match, p1, p2) => `${p1.padStart(2, '0')}:${p2}`);
  str = str.replace(/(\d+):(\d+)\s*PM/g, (match, p1, p2) => `${Number(p1) + 12}:${p2};`);

  str = str.replace(/;$/g, '');

  // str = str.replace(/Mo-Su Sun-Th -/g, 'Su-Th');

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

const saveFile = "themarketplace_ph";
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
    "phones": { "store": [prop.phones] },
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
