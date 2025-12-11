import * as cheerio from 'cheerio'
import fetch from "node-fetch";
import GeoJSON from 'geojson';
import fse from 'fs-extra';
import { v4 as uuidv4 } from "uuid";
import { dateformat } from '../scripts/date.js';

const spider_name = "scotiabank_sg"
const start_urls = "https://www.scotiabank.com/"
const brand_name = "Scotiabank"
const spider_type = "chain"
const source = "DPA_SPIDER_SEA"
const chain_id = "1369"
const chain_name = "Scotiabank"
const categories = "700-7000-0107,700-7010-0108";
const foodtypes = null;

const processScraping = async () => {
  const savename = 'scotiabank_sg'
  console.log('start fetching')
  let jsonData = {
    siteId: '203',
    chainName: 'Scotiabank',
    ISO: 'SGP',
    SN: '700-7000-0107,700-7010-0108',
    category: 'Bank,ATM',
    url: 'https://www.scotiabank.com/global/en/country/singapore.html',
    entities: []
  }

    const res = await fetch(jsonData.url)
    const htmlString = await res.text()
    const $ = cheerio.load(htmlString);
    let entities = []
    let count = 0

    const name = $('.bns--title').eq(2).text().trim()
    const string = $('.cmp-text').eq(1).find('p').eq(2).text()

    const addressRegex = /^([\s\S]*?),\s*Singapore\s+(\d{6})/;
    const addressMatch = string.match(addressRegex);
    const address = addressMatch ? addressMatch[0].trim() : null;

    const phoneRegex = /T\s*(\d{2}\.\d{4}\.\d{4})/;
    const phoneMatch = string.match(phoneRegex);
    const phoneNumber = phoneMatch ? phoneMatch[1] : null;

    entities.push({
      name : name,
      address : address.trim().replace(/\n\s*/g, ', '),
      phone : phoneNumber.replace(/\./g, ''),
      latitude : 1.2811525639101284,
      longitude : 103.85159590825016
    })
    
    console.log('res-> ', entities[0])
    jsonData.entities = entities
    return jsonData.entities;
    // fs.writeFileSync(`../2024-1-done/${savename}.json`, JSON.stringify(jsonData, null, 2));
};

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
            "fax":{"store": prop.fax || null},
              "store": prop.phone},
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
