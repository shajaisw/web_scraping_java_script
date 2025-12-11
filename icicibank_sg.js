import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import GeoJSON from 'geojson';
import fse from 'fs-extra';
import { v4 as uuidv4 } from "uuid";
import { dateformat } from '../scripts/date.js';

const spider_name = "icicibank_sg"
const start_urls = "https://www.icicibank.com.sg/"
const brand_name = "ICICI Bank"
const spider_type = "chain"
const source = "DPA_SPIDER_SEA"
const chain_id = "2514"
const chain_name = "ICICI Bank"
const categories = "700-7000-0107,700-7010-0108";
const foodtypes = null;

const processScraping = async () => {
  const savename = 'icicibank_sg'
  console.log('start fetching')
  let jsonData = {
    siteId: '194',
    chainName: 'ICICI Bank',
    ISO: 'SGP',
    SN: '700-7000-0107,700-7010-0108',
    category: 'Bank,ATM',
    url: 'https://www.icicibank.com.sg/en/contact_us',
    entities: []
  }

  const res = await fetch(jsonData.url);
  const htmlString = await res.text();
  const $ = cheerio.load(htmlString);
  let entities = [];

  const string = $('.rightColumnContainer').find('.main-contentz').find('p').eq(0).text()
  const lines = string.split('\n').map(line => line.trim());
  const bankName = lines[0];
  const address = lines.slice(1, 3).join(', ');
  
  
  const timing = lines[3].substring(8);
  const timing1 = lines[4];

  const hours = `${timing}; ${timing1}`

  entities.push({
    name: bankName,
    address: address,
    workHours: convertHours(hours),
    phone: '8001012553',
    latitude: 1.2832780555,
    longitude: 103.85092246,

  })
  console.log('res-> ', entities[0])
  jsonData.entities = entities;
  return jsonData.entities;
// fs.writeFileSync(`../2024-1-done/${savename}.json`, JSON.stringify(jsonData, null, 2));
};

function convertHours(str){
  str = str.replace(/Monday to Friday,/g, 'Mo-Fr');
  str = str.replace(/ hrs/g, '');
  str = str.replace(/1100-1500/g, '11:00-15:00');
  str = str.replace(/1100-1500/g, '11:00-15:00');
  str = str.replace(/Closed on: Saturday, Sunday and Public Holidays./, 'Sa, Su, PH Closed');

  return str;
}

const finalData = await processScraping();
//process json data into geojson format for spider platform
const features = finalData.map( prop => {
  return {
          "addr:full":prop.address,
          "addr:street":prop.street,
          "addr:city":prop.city,
          "addr:state":prop.state,
          "addr:country":"Singapore",
          "addr:postcode":prop.postCode,
          "name":prop.name,
          "Id":prop.id || uuidv4(),
          "phones":{
            "fax":{"store":null},
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
