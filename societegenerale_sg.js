import fs from "fs";
import * as cheerio from 'cheerio'
import fetch from "node-fetch";
import GeoJSON from 'geojson';
import fse from 'fs-extra';
import { v4 as uuidv4 } from "uuid";
import { dateformat } from '../scripts/date.js';

const spider_name = "societegenerale_sg"
const start_urls = "https://www.societegenerale.asia/"
const brand_name = "Société Générale"
const spider_type = "chain"
const source = "DPA_SPIDER_SEA"
const chain_id = "1259"
const chain_name = "Société Générale"
const categories = "700-7000-0107,700-7010-0108";
const foodtypes = null;

const processScraping = async () => {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

  const savename = 'societegenerale_sg'
  console.log('start fetching')
  let jsonData = {
    siteId: '202',
    chainName: 'Société Générale',
    ISO: 'SGP',
    SN: '700-7000-0107,700-7010-0108',
    category: 'Bank,ATM',
    url: 'https://www.societegenerale.asia/en/about-asia-pacific/locations/',
    entities: []
  }

  const res = await fetch(jsonData.url)
  console.log(res)
  const htmlString = await res.text();
  const $ = cheerio.load(htmlString);
  let entities = [];

  // const name = $('.mainTitle').text()
  // const address = $('.bodytext').eq(6).text().replace('Address:', '')
  // const contact = $('.bodytext').eq(3).text()

  // const phoneRegex = /\+?\d{2}\s?\d{4}\s?\d{4}/; // Regex pattern for phone number
  // const phoneMatch = contact.match(phoneRegex);
  // const phoneNumber = phoneMatch ? phoneMatch[0] : null;
  // console.log(contact)
  entities.push({
    name : 'Societe Generale Singapore',
    address : '8 Marina Boulevard,12-01 Marina Bay Financial Centre Tower 1018981 Singapore',
    phone : '+65 6222 7122',
    latitude : 1.2802161987150373,
    longitude : 103.8525390625
  })
  
  console.log('res-> ', entities[0])
  jsonData.entities = entities;
  return jsonData.entities;
  // fs.writeFileSync(`../2024-1-done/${savename}.json`, JSON.stringify(jsonData, null, 2));
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
              "store":prop.phone},
          "store_url":prop.url,
          "website":start_urls,
          "operatingHours":{"store": prop.operatingHours},
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
