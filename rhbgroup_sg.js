import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import GeoJSON from 'geojson';
import fse from 'fs-extra';
import { v4 as uuidv4 } from "uuid";
import { dateformat } from '../scripts/date.js';

const spider_name = "rhbgroup_sg"
const start_urls = "https://rhbgroup.com.sg/"
const brand_name = "RHB BANK"
const spider_type = "chain"
const source = "DPA_SPIDER_SEA"
const chain_id = "7092"
const chain_name = "RHB BANK"
const categories = "700-7000-0107, 700-7010-0108";
const foodtypes = null;

const processScraping = async () => {
  const savename = 'rhbgroup_sg'
  console.log('start fetching')
  let jsonData = {
    siteId: '187',
    chainName: 'RHB BANK',
    ISO: 'SGP',
    SN: '700-7000-0107, 700-7010-0108',
    category: 'Bank,ATM',
    url: 'https://rhbgroup.com.sg/rhb/locate',
    entities: []
  }

  const res = await fetch('https://rhbgroup.com.sg/rhb/locate')
  const htmlString = await res.text()
  const $ = cheerio.load(htmlString);
  let entities = []
    
  $('.child-tab-content').each((index, ele) => {
    const name = $(ele).find('.font24px').text()
    const address = $(ele).find('.top-content-comp').find('p').eq(0).text()
    const type =  $(ele).find('div.d-flex.justify-content-between.w-100 > span').text()

    const url = $(ele).find('.without-layout').find('iframe').attr('src')

    entities.push({
      name: name.trim(),
      type: type.trim(),
      address : address.trim(),
      gpsUrl: url
    })
  })
  console.log('res-> ', entities[0])
  jsonData.entities = entities;
  return jsonData.entities;
  // fs.writeFileSync(`../2024-1-done/${savename}.json`, JSON.stringify(jsonData, null, 2));
};

// processScraping()

//for branch 1, 2 and 4 beanches
//div[@class="top-content-comp w-100"]/div/p[3]/span[@style="font-size:16px"]/span[@style="color:#0067b1"]

//Parkway
//div[@class="top-content-comp w-100"]/div/p[5]/span[@style="font-size:16px"]/span[@style="color:#0067b1"]

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
              "store":[prop.phones]},
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