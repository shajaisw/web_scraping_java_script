import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import GeoJSON from 'geojson';
import fse from 'fs-extra';
import { v4 as uuidv4 } from "uuid";
import { dateformat } from '../scripts/date.js';

const spider_name = "bofa_sg"
const start_urls = "https://business.bofa.com/sg/"
const brand_name = "Bank of America"
const spider_type = "chain"
const source = "DPA_SPIDER_SEA"
const chain_id = "1290"
const chain_name = "Bank of America"
const categories = "700-7000-0107,700-7010-0108";
const foodtypes = null;

const processScraping = async () => {
  const savename = 'bofa_sg'
  console.log('start fetching')
  let jsonData = {
    siteId: '213',
    chainName: 'Bank of America',
    ISO: 'SGP',
    SN: '700-7000-0107,700-7010-0108',
    category: 'Bank,ATM',
    url: 'https://business.bofa.com/sg/en/about-us.html',
    entities: []
  }

    const res = await fetch(jsonData.url)
    const htmlString = await res.text()
    const $ = cheerio.load(htmlString);
    let entities = []
    
    const name = jsonData.chainName
    const contact = $('.content__body').eq(4).find('p').eq(0).text()
    const lines = contact.split('\n').map(line => line.trim());
    const address = lines.slice(3, 6).join(', ');
    const phoneNumber = ' +65-6678-0000'

    entities.push({
      name: name,
      address: 'Merrill Lynch (Singapore) Pte. Ltd.OUE Bayfront #14-0150 Collyer Quay Singapore 049321',
      phone: phoneNumber,
      latitude: 1.28285981889383,
      longitude: 103.85308523524431,
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
