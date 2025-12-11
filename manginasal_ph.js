//import necessary modules and libraries
import fetch from 'node-fetch';
import GeoJSON from 'geojson';
import fse from 'fs-extra';
import { v4 } from "uuid"; 
import { dateformat } from '../scripts/date.js';

//update the following variables
const spider_name = "manginasal_ph"
const start_urls = "https://manginasaldelivery.com.ph/"
const brand_name = "Mang Inasal"
const spider_type = "chain"
const source = "DPA_SPIDERS"
const chain_id = "8091"
const chain_name = "Mang Inasal"
const categories = "100-1000-0001";
const foodtypes = "212-000";

///////////////////////////////////////////////////////////////////////////////////////////////////////////////

const processScraping = async () => {
  // Configure axios to ignore SSL certificate validation errors
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

  const savename = "manginasal_ph";
  console.log('start fetching')
  let jsonData = {
    siteId: '155',
    chainName: 'Mang Inasal',
    ISO: 'PHL',
    SN: '8091',
    category: 'Casual Dining',
    url: 'https://www.manginasal.ph/locations',
    entities: []
  }

  let jsonString = ``
  let url = `https://www.manginasal.ph/wp-content/uploads/file_uploads/store-data.json`

      const res = await fetch(url)
      jsonString = await res.json()

    // const dataString = jsonString.replace('false,', '').replace('false', '')
    const data = jsonString
    
    // Filter and map the data to extract required fields and remove false values
    let entities = data.filter(item => item !== false).map(item => ({
      id: item.storecode,
      cityarea: item.cityarea,
      address: item.address.replace(/\#/g, ''),
      name: item.storename,
      phone: item.contactnumbers
    }));

    console.log('res-> ', entities[0])

    jsonData.entities = entities;

    return jsonData.entities;
    // fs.writeFileSync(`../2024-1-done/${savename}.json`, JSON.stringify(jsonData, null, 2));

  
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

const saveFile = "manginasal_ph";
const country = "Philippines";

//remove duplicate
const uniqueData = jsondata.reduce((acc, curr) => {
  const existingItem = acc.find((item) => item.address.replace(/\#/g, '') === curr.address.replace(/\#/g, ''));
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
    "addr:country": "Philippines",
    "addr:postcode": prop.postCode,
    "name": prop.name,
    "Id": prop.id || v4(),
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