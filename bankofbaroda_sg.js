import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import GeoJSON from 'geojson';
import fse from 'fs-extra';
import { v4 as uuidv4 } from "uuid";
import { dateformat } from '../scripts/date.js';

const spider_name = "bankofbaroda_sg"
const start_urls = "https://www.bankofbaroda.com.sg/"
const brand_name = "Bank of Baroda"
const spider_type = "chain"
const source = "DPA_SPIDER_SEA"
const chain_id = "2494"
const chain_name = "Bank of Baroda"
const categories = "700-7000-0107,700-7010-0108";
const foodtypes = null;

const processScraping = async () => {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

  const savename = 'bankofbaroda_sg';
  console.log('start fetching');
  let jsonData = {
    siteId: '212',
    chainName: 'Bank of Baroda',
    ISO: 'SGP',
    SN: '700-7000-0107,700-7010-0108',
    category: 'Fast Food',
    url: 'https://www.bankofbaroda.com.sg/locate-us/branches',
    entities: []
  };

  const res = await fetch('https://www.bankofbaroda.com.sg/locate-us/branches');
  console.log('Website response:', res);
  const html = await res.text();
  const $ = cheerio.load(html);

  // Use a regular expression to find the JSON data
  const scriptTagContent = $('script:contains("BranchesDetails")').html();
  const jsonMatch = scriptTagContent.match(/BranchesDetails\s*=\s*(\[{.*?}])/);

  if (jsonMatch && jsonMatch[1]) {
    try {
      const json_data = jsonMatch[1]; // Extracted JSON data
      const stores = JSON.parse(json_data);

      let entities = [];

      for (const item of stores) {
        entities.push({
          name: item.branch_name,
          phone: item.phone,
          address: item.address.replace(/\#/g, ''),
          fax: item.fax_number,
          city: item.city,
          state: item.State,
          postalCode: item.pincode,
          latitude: item.lat,
          longitude: item.lng,
        });
      }
      console.log('First entity:', entities[0]);
      jsonData.entities = entities;
      return jsonData.entities;
      // fs.writeFileSync(`../2024-1-done/${savename}.json`, JSON.stringify(jsonData, null, 2));
    } catch (error) {
      console.error('Error parsing JSON:', error);
    }
  } else {
    console.error('Could not find the JSON data in the page.');
  }
};

const finalData = await processScraping();
const features = finalData.map( prop => {
  return {
          "addr:full":prop.address,
          "addr:street":prop.street,
          "addr:city":prop.city,
          "addr:state":prop.state,
          "addr:country":"Singapore",
          "addr:postcode":prop.postalCode,
          "name":prop.name,
          "Id":prop.id || uuidv4(),
          "phones":{
            "fax":{"store": prop.fax},
              "store":[prop.phone]},
          "store_url":prop.url,
          "website":start_urls,
          "operatingHours":{"store": prop.workHours},
          "services": prop.services || null,
          "chain_id": chain_id,
          "chain_name": chain_name,
          "brand": brand_name,
          "categories":categories,
          "foodtypes":foodtypes,
          "lat":prop.latitude,
          "lng":prop.longitude,
        }
  
  });
  console.log ("{ item_scraped_count:" , features.length,"}")
  const logfile = `{ "item_scraped_count": ` +features.length + " }"
  const outputGeojson = GeoJSON.parse(features,{Point:['lat','lng'],removeInvalidGeometries:true});
      
  const geoExp = JSON.stringify(outputGeojson);
  fse.outputFileSync(`./output/${source}/${spider_name}/${dateformat}/${spider_name}.geojson`,geoExp);
  fse.outputFileSync(`./output/${source}/${spider_name}/${dateformat}/${spider_name}_log.json`,logfile);

