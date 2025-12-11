//import necessary modules and libraries
import axios from "axios";
import * as cheerio from 'cheerio'
import GeoJSON from 'geojson';
import fse from 'fs-extra';
import { v4 as uuidv4 } from "uuid";
import { dateformat } from '../scripts/date.js';
import dotenv from 'dotenv'

//update the following variables
const spider_name = "statebankIndia_sg_atms"
const start_urls = "https://sg.statebank//"
const brand_name = "State Bank of India"
const spider_type = "chain"
const source = "DPA_SPIDERS"
const chain_id = "2530"
const chain_name = "State Bank of India"
const categories = "700-7010-0108";
const foodtypes = null;

//////////////////////////////////////////////////////////////////////////////////////

const processScraping = async () => {
  // const savename = 'statebankIndia_sg'
  console.log('start fetching')
  let jsonData = {
    siteId: '184',
    chainName: 'State Bank of India',
    ISO: 'SGP',
    SN: '2530',
    category: 'ATM',
    url: 'https://sg.statebank/branch-locator',
    entities: []
  }

  let htmlString = ``

    const res = await axios.get(jsonData.url)
    htmlString = res.data

    const $ = cheerio.load(htmlString);

    let entities = []
    let count = 0

    $('#sub-tab2').find('.panel-default').each((index, ele) => {
      const name = $(ele).find('h4').text()
      const address = $(ele).find('.panel-collapse').text().replace(/\s+/g, ' ').trim();
      entities.push({
        name: name.trim(),
        address : address.trim()
        
      })
    })

    console.log('res-> ', entities[0])

    jsonData.entities = entities

    return jsonData.entities;
    // fs.writeFileSync(`../2024-1-done/${savename}.json`, JSON.stringify(jsonData, null, 2))
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

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

const saveFile = "statebankIndia_sg_atms";
const country = "Singapore";

//remove duplicate
const uniqueData = jsondata.reduce((acc, curr) => {
  const existingItem = acc.find((item) => item.address === curr.address);
  if (!existingItem) {
    acc.push(curr);
  }
  return acc;
}, []);
        
const searchtext = uniqueData.map(prop => { return prop.address.replace(/\s/g,'+') });
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
    "addr:country": "Singapore",
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
