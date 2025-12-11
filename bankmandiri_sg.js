import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import GeoJSON from 'geojson';
import fse from 'fs-extra';
import { v4 as uuidv4 } from "uuid";
import { dateformat } from '../scripts/date.js';

const spider_name = "bankmandiri_sg"
const start_urls = "https://bankmandiri.com.sg/"
const brand_name = "mandiri"
const spider_type = "chain"
const source = "DPA_SPIDER_SEA"
const chain_id = "3642"
const chain_name = "mandiri"
const categories = "700-7000-0107,700-7010-0108";
const foodtypes = null;

const processScraping = async () => {
  const savename = 'bankmandiri_sg'
  console.log('start fetching')
  let jsonData = {
    siteId: '214',
    chainName: 'mandiri',
    ISO: 'SGP',
    SN: '700-7000-0107,700-7010-0108',
    category: 'Bank,ATM',
    url: 'https://bankmandiri.com.sg/about-mandiri-singapore/',
    entities: []
  }

  const res = await fetch(jsonData.url)
  const htmlString = await res.text()

  const $ = cheerio.load(htmlString);
  let entities = []
  let count = 0

  const name = jsonData.chainName
  const stringData = $('.wpb_wrapper').eq(14).find('p').text()
  const lines = stringData.split('\n').map(line => line.trim());
  const address = lines[2];
  const phone1 = lines[6]; // Remove the last line (email)
  const phone2 = lines[4];
  const email = lines[8];

  $('')

  entities.push({
    name: 'Bank Mandiri Singapore',
    address: '12 Marina View 19-01 Asia Square Tower 2 Singapore 018961',
    phone: '+65 6213 5688',
    latitude: 1.27916558,
    longitude: 103.850832
  })

  console.log('res-> ', entities[0])
  jsonData.entities = entities;
  return jsonData.entities;
};
 
const finalData = await processScraping();
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
