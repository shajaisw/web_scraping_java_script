import * as cheerio from 'cheerio';
import dotenv from 'dotenv';
import xpath from 'xpath';
import { DOMParser } from 'xmldom';
import fetch from "node-fetch";
import GeoJSON from 'geojson';
import fse from 'fs-extra';
import { v4 as uuidv4 } from "uuid";
import { dateformat } from '../scripts/date.js';

const spider_name = "creditagricole_sg"
const start_urls = "https://www.credit-agricole.com/"
const brand_name = "Crédit Agricole"
const spider_type = "chain"
const source = "DPA_SPIDER_SEA"
const chain_id = "1253"
const chain_name = "Crédit Agricole"
const categories = "700-7000-0107,700-7010-0108";
const foodtypes = null;

dotenv.config();

const processScraping = async () => {
  const savename = 'creditagricole_sg'
  console.log('start fetching')
  const googleMapLink = `https://www.google.com/maps/dir/56.6099968,118.3449088/uco+bank+singapore/@21.2332876,65.7250889,3z/data=!3m1!4b1!4m9!4m8!1m1!4e1!1m5!1m1!1s0x31da190ea2f993e5:0xa8d089d9cff34ab1!2m2!1d103.8511247!2d1.2834766?entry=ttu`
  let jsonData = {
    siteId: '195',
    chainName: 'Crédit Agricole',
    ISO: 'SGP',
    SN: '700-7000-0107,700-7010-0108',
    category: 'Bank,ATM',
    url: 'https://www.credit-agricole.com/en/group/list-of-our-locations',
    entities: []
  }

  const res = await fetch(jsonData.url);
  const htmlString = await res.text();
  const $ = cheerio.load(htmlString);
  let entities = [];
  let count = 0;

  let name, address, phone, fax, email, lat=0, lng=0, site
  const doc = new DOMParser().parseFromString(htmlString, 'text/xml');
  count++
  name = xpath.select('//*[@id=\"block-contenu\"]/div[3]/div[2]/div/div/div/div[2]/ul/li[2]/div/div[2]/div/h4[15]', doc)[0]?.firstChild.data
  const address11 = xpath.select('//*[@id="block-contenu"]/div[3]/div[2]/div/div/div/div[2]/ul/li[2]/div/div[2]/div/p[55]/text()[1]', doc)[0].data
  const address12 = xpath.select('//*[@id="block-contenu"]/div[3]/div[2]/div/div/div/div[2]/ul/li[2]/div/div[2]/div/p[55]/text()[2]', doc)[0].data
  const address13 = xpath.select('//*[@id="block-contenu"]/div[3]/div[2]/div/div/div/div[2]/ul/li[2]/div/div[2]/div/p[55]/text()[3]', doc)[0].data
  site = xpath.select('//*[@id="block-contenu"]/div[3]/div[2]/div/div/div/div[2]/ul/li[2]/div/div[2]/div/p[55]/a', doc)[0].firstChild.data
  address = `${address11} ${address12} ${address13}`
  phone = xpath.select('//*[@id="block-contenu"]/div[3]/div[2]/div/div/div/div[2]/ul/li[2]/div/div[2]/div/p[55]/text()[4]', doc)[0].data
  fax = xpath.select('//*[@id="block-contenu"]/div[3]/div[2]/div/div/div/div[2]/ul/li[2]/div/div[2]/div/p[55]/text()[5]', doc)[0].data
  entities.push({
    name, address, phone, fax, email,site,
    latitude: lat,
    longitude: lng,
  })

  count++
  name = xpath.select('//*[@id="block-contenu"]/div[3]/div[2]/div/div/div/div[2]/ul/li[2]/div/div[2]/div/h4[16]', doc)[0]?.firstChild.data
  const address21 = xpath.select('//*[@id="block-contenu"]/div[3]/div[2]/div/div/div/div[2]/ul/li[2]/div/div[2]/div/p[57]/text()[1]', doc)[0].data
  const address22 = xpath.select('//*[@id="block-contenu"]/div[3]/div[2]/div/div/div/div[2]/ul/li[2]/div/div[2]/div/p[57]/text()[2]', doc)[0].data
  const address23 = xpath.select('//*[@id="block-contenu"]/div[3]/div[2]/div/div/div/div[2]/ul/li[2]/div/div[2]/div/p[57]/text()[3]', doc)[0].data
  site = xpath.select('//*[@id="block-contenu"]/div[3]/div[2]/div/div/div/div[2]/ul/li[2]/div/div[2]/div/p[57]/a', doc)[0].firstChild.data
  address = `${address21} ${address22} ${address23}`
  phone = xpath.select('//*[@id="block-contenu"]/div[3]/div[2]/div/div/div/div[2]/ul/li[2]/div/div[2]/div/p[57]/text()[4]', doc)[0].data
  fax = xpath.select('//*[@id="block-contenu"]/div[3]/div[2]/div/div/div/div[2]/ul/li[2]/div/div[2]/div/p[57]/text()[5]', doc)[0]?.data
  entities.push({
    name, address, phone, fax, email,site,
    latitude: lat,
    longitude: lng,
  })

  count++
  name = xpath.select('//*[@id="block-contenu"]/div[3]/div[2]/div/div/div/div[2]/ul/li[2]/div/div[2]/div/h4[17]', doc)[0]?.firstChild.data
  const address31 = xpath.select('//*[@id="block-contenu"]/div[3]/div[2]/div/div/div/div[2]/ul/li[2]/div/div[2]/div/p[59]/text()[1]', doc)[0].data
  const address32 = xpath.select('//*[@id="block-contenu"]/div[3]/div[2]/div/div/div/div[2]/ul/li[2]/div/div[2]/div/p[59]/text()[2]', doc)[0].data
  const address33 = xpath.select('//*[@id="block-contenu"]/div[3]/div[2]/div/div/div/div[2]/ul/li[2]/div/div[2]/div/p[59]/text()[3]', doc)[0].data
  site = xpath.select('//*[@id="block-contenu"]/div[3]/div[2]/div/div/div/div[2]/ul/li[2]/div/div[2]/div/p[59]/a', doc)[0].firstChild.data
  address = `${address31} ${address32} ${address33}`
  phone = xpath.select('//*[@id="block-contenu"]/div[3]/div[2]/div/div/div/div[2]/ul/li[2]/div/div[2]/div/p[59]/text()[4]', doc)[0].data
  fax = xpath.select('//*[@id="block-contenu"]/div[3]/div[2]/div/div/div/div[2]/ul/li[2]/div/div[2]/div/p[59]/text()[5]', doc)[0]?.data
  entities.push({
    name, address, phone, fax, email,site,
    latitude: lat,
    longitude: lng,
  })

  console.log('res-> ', entities[2]);
  console.log('count: ', count);
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

 