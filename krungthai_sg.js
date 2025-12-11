import * as cheerio from 'cheerio'
import fetch from "node-fetch";
import GeoJSON from 'geojson';
import fse from 'fs-extra';
import { v4 as uuidv4 } from "uuid";
import { dateformat } from '../scripts/date.js';

const spider_name = "krungthai_sg"
const start_urls = "https://krungthai.com/"
const brand_name = "KRUNGTHAI BANK"
const spider_type = "chain"
const source = "DPA_SPIDER_SEA"
const chain_id = "6986"
const chain_name = "KRUNGTHAI BANK"
const categories = "700-7000-0107,700-7010-0108";
const foodtypes = null;

const processScraping = async () => {
  const savename = 'krungthai_sg';
  console.log('start fetching')
  let jsonData = {
    siteId: '206',
    chainName: 'KRUNGTHAI BANK',
    ISO: 'SGP',
    SN: '700-7000-0107,700-7010-0108',
    category: 'Bank,ATM',
    url: 'https://krungthai.com/en/contact-us/foreign-branch',
    entities: []
  }

    const res = await fetch(jsonData.url)
    const htmlString = await res.text()
    const $ = cheerio.load(htmlString);
    let entities = []
    
    const name = jsonData.chainName
    const address = $('.ktfast-small').eq(5).text().replace(/\n\t\t\t\t\t\t\t/g, '')
    const phone = $('.ktfast-normal').eq(11).text()
    const fax = $('.ktfast-normal').eq(12).text()
    const email = $('.ktfast-normal').eq(13).text()

    entities.push({
      name: name,
      address: address,
      phone: phone,
      fax: fax,
      email: email,
      latitude: 1.28542953970821,
      longitude: 103.8492710958416
    })
    
    console.log('res-> ', entities[0])
    jsonData.entities = entities;
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
