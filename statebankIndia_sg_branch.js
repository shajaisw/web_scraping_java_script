//import necessary modules and libraries
import axios from "axios";
import * as cheerio from 'cheerio'
import GeoJSON from 'geojson';
import fse from 'fs-extra';
import { v4 as uuidv4 } from "uuid";
import { dateformat } from '../scripts/date.js';
import dotenv from 'dotenv'

//update the following variables
const spider_name = "statebankIndia_sg_branch"
const start_urls = "https://sg.statebank//"
const brand_name = "State Bank of India"
const spider_type = "chain"
const source = "DPA_SPIDERS"
const chain_id = "2530"
const chain_name = "State Bank of India"
const categories = "700-7000-0107";
const foodtypes = null;

//////////////////////////////////////////////////////////////////////////////////////

const processScraping = async () => {
  const jsonData = {
    siteId: '184',
    chainName: 'State Bank of India',
    ISO: 'SG',
    SN: '2530',
    category: 'Bank',
    url: 'https://sg.statebank/branch-locator',
    entities: []
  };

  try {
    const res = await axios.get(jsonData.url);
    const htmlString = res.data;
    const $ = cheerio.load(htmlString);

    $('#sub-tab1 .panel-default').each((index, ele) => {
      const name = $(ele).find('.panel-title a').text().trim();
      let address, operatingHours, telephone;

      if (name === 'LITTLE INDIA BRANCH') {
        address = ($(ele).find('.panel-body .inner-row-content p:nth-of-type(1)').html()?.replace(/<br\s*\/?>/gi, '\n').trim() || '').replace(/\n\n/g, ' ').replace(/\#/g, '');
        operatingHours = [
          $(ele).find('.panel-body .inner-row-content:nth-of-type(3) p:nth-of-type(2)').text().trim(),
          $(ele).find('.panel-body .inner-row-content:nth-of-type(3) p:nth-of-type(3)').text().trim()
        ].join('; ');
        telephone = $(ele).find('.panel-body .inner-row-content ul.content-listing li:nth-of-type(1)').text().split(': ')[1]?.trim() || '';
      } else {
        address = ($(ele).find('.panel-collapse .inner-row-content p:nth-of-type(2)').html()?.replace(/<br\s*\/?>/gi, '\n').trim() || '').replace(/\n\n/g, ' ').replace(/\#/g, '');
        operatingHours = [
          $(ele).find('.panel-collapse .inner-row-content p:nth-of-type(4)').text().trim(),
          $(ele).find('.panel-collapse .inner-row-content p:nth-of-type(5)').text().trim(),
          $(ele).find('.panel-collapse .inner-row-content p:nth-of-type(6)').text().trim()
        ].join('; ');
        
        const telephoneElement = $(ele).find('.panel-collapse .inner-row-content').filter(function () {
          return $(this).text().includes('Tel:');
        });
        const phoneData = telephoneElement.length > 0 ? telephoneElement.text().split('Tel: ')[2]?.trim() : '';
        telephone = phoneData.match(/\(\d+\)\s*\d+\s*\d+/)?.[0] || '';
      }

      jsonData.entities.push({
        name,
        address,
        operatingHours : convertHours(operatingHours),
        telephone
      });
    });

    console.log('Entities:', jsonData.entities);
    return jsonData.entities;
  } catch (error) {
    console.error('Error during scraping:', error);
    return [];
  }
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function convertHours(str){
  str = str.replace(/\./g, ":");
  str = str.replace(/ to /g, "-");

  str = str.replace(/Monday -  Friday:/g, "Mo-Fo");
  str = str.replace(/Monday :/g, "Mo");
  str = str.replace(/Tuesday -  Sunday:/g, "Tu-Su");
  str = str.replace(/Saturday :/g, "Sa");
  str = str.replace(/Sunday :/g, "Su");
  str = str.replace(/Holiday/g, "Closed");

  //Convert Hours 
  str = str.replace(/(\d+):(\d+)\s*am/g, (match, p1, p2) => `${p1.padStart(2, '0')}:${p2}`);
  str = str.replace(/(\d+):(\d+)\s*pm/g, (match, p1, p2) => `${Number(p1) + 12}:${p2}`);

  str = str.replace(/24:30/g, "12:30");

  return str
}
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

const saveFile = "statebankIndia_sg_branch";
const country = "Singapore";

//remove duplicate
const uniqueData = jsondata.reduce((acc, curr) => {
  const existingItem = acc.find((item) => item.address.replace(/\#/g, '') === curr.address.replace(/\#/g, ''));
  if (!existingItem) {
    acc.push(curr);
  }
  return acc;
}, []);
        
const searchtext = uniqueData.map(prop => { return prop.address.replace(/\s/g,'+').replace(/\#/g, '') });
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
    "phones": { "store": [prop.telephone] },
    "fax": { "store": prop.fax },
    "store_url": prop.url,
    "website": start_urls,
    "operatingHours": { "store": prop.operatingHours },
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
