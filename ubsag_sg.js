import fs from "fs";
import * as cheerio from 'cheerio'
import fetch from "node-fetch";
import GeoJSON from 'geojson';
import fse from 'fs-extra';
import { v4 as uuidv4 } from "uuid";
import { dateformat } from '../scripts/date.js';

const spider_name = "ubsag_sg"
const start_urls = "https://www.ubs.com/"
const brand_name = "UBS AG"
const spider_type = "chain"
const source = "DPA_SPIDER_SEA"
const chain_id = "3172"
const chain_name = "UBS AG"
const categories = "700-7000-0107,700-7010-0108";
const foodtypes = null;

const processScraping = async () => {
  const savename = 'ubsag_sg';
  console.log('start fetching')
  let jsonData = {
    siteId: '201',
    chainName: 'UBS AG',
    ISO: 'SG',
    SN: '700-7000-0107,700-7010-0108',
    category: 'Bank,ATM',
    url: 'https://www.ubs.com/locations/singapore/singapore/9-penang-road/ubs-ag-singapore-branch-802.html/1000#:~:text=UBS%20subsidiary%20in%20Singapore%20%2C%209%20Penang%20Road%20%7C%20UBS%20Singapore',
    entities: []
  }

    const res = await fetch(jsonData.url);
    const htmlString = await res.text();
    const $ = cheerio.load(htmlString);
    let entities = [];
    
    const name = $('.loFi-goToMap__title__name').text()
    const address = $('.loFi-goToMap__title__address').text()
    const phone = $('.loFi-details__detail__info__phone').text()
    
    let hoursArray = [];
    $('table.loFi-poi__location__details__schedule__hours > tbody > tr').each((index, element) => {
      const day = $(element).find('th').first().text().trim();
      const time = $(element).find('td').last().text().trim();
      hoursArray.push(`${day} ${time}`);
    });

    const hours = hoursArray.join('; ');

    const url = $('.loFi-poi__location__details__contact__method').eq(0).find('a').attr('href')

    const regex = /daddr=(-?\d+\.\d+),(-?\d+\.\d+)/;
    const match = url.match(regex);

    const latitude = match[1];
    const longitude = match[2];


    entities.push({
      name : name,  
      address : address,
      phone : phone,
      workHours : hours.replace(/\./g, ':').replace(/ - /g, '-').replace(/closed/, 'Closed'),
      latitude : latitude,
      longitude : longitude
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
