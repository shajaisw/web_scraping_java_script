import * as cheerio from 'cheerio'
import fetch from "node-fetch";
import GeoJSON from 'geojson';
import fse from 'fs-extra';
import { v4 as uuidv4 } from "uuid";
import { dateformat } from '../scripts/date.js';

const spider_name = "barclays_sg"
const start_urls = "https://barclays.banklocationmaps.sg/"
const brand_name = "BARCLAYS"
const spider_type = "chain"
const source = "DPA_SPIDER_SEA"
const chain_id = "1093"
const chain_name = "BARCLAYS"
const categories = "700-7000-0107,700-7010-0108";
const foodtypes = null;

const processScraping = async () => {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

  const savename = 'barclays_sg'
  console.log('start fetching')
  let jsonData = {
    siteId: '211',
    chainName: 'BARCLAYS',
    ISO: 'SGP',
    SN: '700-7000-0107,700-7010-0108',
    category: 'Bank,ATM',
    url: 'https://barclays.banklocationmaps.sg/en/branch/578013-barclays-branch-level-24-marina-bay-financial-centre-tower-2-10-marina-boulevard?directions=1#locations',
    entities: []
  }

    const res = await fetch(jsonData.url)
    const htmlString = await res.text() 
    const $ = cheerio.load(htmlString);
    let entities = []
    
    const jsonString = $('script').eq(4).text()
    const data = JSON.parse(jsonString)
    const address = data.address.streetAddress
    const phone = data.telephone
    const latitude = data.geo.latitude
    const longitude = data.geo.longitude
    const name = jsonData.chainName

    // Define a mapping for days of the week
    const daysMapping = {
      "Monday": "Mo",
      "Tuesday": "Tu",
      "Wednesday": "We",
      "Thursday": "Th",
      "Friday": "Fr",
      "Saturday": "Sa",
      "Sunday": "Su"
    };

    let hoursArray = [];
    $('table.table-borderless.table-sm.table-two-column > tbody > tr').each((index, element) => {
      const day = $(element).find('td').first().text().trim();
      let time = $(element).find('td').last().text().trim();

      // Convert to the desired format
      if (time === '24 hours') {
        time = '00:00-24:00';
      }

      const abbreviatedDay = daysMapping[day];
      hoursArray.push(`${abbreviatedDay} ${time}`);
    });

    const hours = hoursArray.join('; ').replace(/; undefined $/g, '');

    entities.push({
      name: name,
      address: address,
      phone: phone,
      latitude : latitude,
      longitude : longitude,
      workHOurs: hours
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

