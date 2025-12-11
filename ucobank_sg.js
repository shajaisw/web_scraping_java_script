import fs from "fs";
import * as cheerio from 'cheerio'
import fetch from "node-fetch";
import GeoJSON from 'geojson';
import fse from 'fs-extra';
import { v4 as uuidv4 } from "uuid";
import { dateformat } from '../scripts/date.js';

const spider_name = "ucobank_sg"
const start_urls = "https://www.ucobank.com.sg/"
const brand_name = "Uco Bank"
const spider_type = "chain"
const source = "DPA_SPIDER_SEA"
const chain_id = "2047"
const chain_name = "Uco Bank"
const categories = "700-7000-0107,700-7010-0108";
const foodtypes = null;

String.prototype.cleanStr = function () {
  return this.replace(/^\s+|\s+$/g, '').replace(/\u00A0/g, ' ').replace(/\u202F/g, ' ')
};
const extractGeo = (urlString = 'google.com') => {
   const googleMapLink = `https://www.google.com/maps/dir/56.6099968,118.3449088/uco+bank+singapore/@21.2332876,65.7250889,3z/data=!3m1!4b1!4m9!4m8!1m1!4e1!1m5!1m1!1s0x31da190ea2f993e5:0xa8d089d9cff34ab1!2m2!1d103.8511247!2d1.2834766?entry=ttu`
  const regex = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
  const match = urlString.match(regex);

  if (match) {
    const latitude = parseFloat(match[1]);
    const longitude = parseFloat(match[2]);
    return [latitude, longitude]
  } else {
    return [0, 0]
  }
}
const processScraping = async () => {

  const savename = 'ucobank_sg'
  const googleMapLink = `https://www.google.com/maps/dir/56.6099968,118.3449088/uco+bank+singapore/@21.2332876,65.7250889,3z/data=!3m1!4b1!4m9!4m8!1m1!4e1!1m5!1m1!1s0x31da190ea2f993e5:0xa8d089d9cff34ab1!2m2!1d103.8511247!2d1.2834766?entry=ttu`

  console.log('start fetching')
  let jsonData = {
    siteId: '200',
    chainName: 'Uco Bank',
    ISO: 'SGP',
    SN: '2047',
    category: 'Bank,ATM',
    url: 'https://www.ucobank.com.sg/contact',
    entities: []
  }

  const res = await fetch('https://www.ucobank.com.sg/contact');
  const  htmlString = await res.text();
  const $ = cheerio.load(htmlString);
  let entities = [];
  let count = 0

  count++
  const name = $('title').text().cleanStr()
  const address = $('.chief').text().cleanStr()
  const phoneRegex = /Phone\s*:\s*(\d+\sEXT\s\d+)/
  const faxRegex = /\(\d{2}\)\s\d{4}\s\d{4}/;
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const phone = $('.chief').eq(0).parent().text().cleanStr().match(phoneRegex)[1]
  const fax = $('.chief').eq(0).parent().text().cleanStr().match(faxRegex)[0]
  const email = $('.chief').eq(0).parent().text().cleanStr().match(emailRegex)[0]
  const [lat, lng] = extractGeo(googleMapLink)
  entities.push({
    name, address, phone, fax, email,
    latitude: lat,
    longitude: lng,

  })

  console.log('res-> ', entities[0])
  console.log('count: ', count)
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
