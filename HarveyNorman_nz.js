//import necessary modules and libraries
import axios from 'axios';
import fetch from 'node-fetch';
import GeoJSON from 'geojson';
import fse from 'fs-extra';
import * as cheerio from "cheerio";
import { v4 as uuidv4 } from "uuid"; // Import v4 function as uuidv4
import { dateformat } from '../../scripts/date.js';

//update the following variables
const spider_name = "HarveyNorman_nz"
const start_urls = "https://www.harveynorman.com.au/"
const brand_name = "Harvey Norman"
const spider_type = "chain"
const source = "DPA_SPIDERS"
const chain_id = "4364"
const chain_name = "Harvey Norman"
const categories = "600-6500-0072";
const foodtypes = null;

///////////////////////////////////////////////////////////////////////////////////////////////////////////////

const processScraping = async () => {
  // Configure axios to ignore SSL certificate validation errors
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

  const savename = "HarveyNorman_nz"
  console.log('start fetching')
  let jsonData = {
    siteId: '340',
    chainName: 'Harvey Norman',
    ISO: 'NZL',
    SN: '4364',
    category: 'Consumer Electronics Store',
    url: 'https://stores.harveynorman.co.nz/',
    entities: []
  }

  let jsonString = ``
  // let url = `https://consumer.shopsm.com/api/v1/getMarketsBranches`

  const res = await fetch(jsonData.url)
  jsonString = await res.text()

const $ = cheerio.load(jsonString);
const data3 = $('script#__NEXT_DATA__').html()
const data4 = JSON.parse(data3)
console.log(data4.props.pageProps.locations)
   //   #__NEXT_DATA__
    const jsonDataString = data4
    const dataString = JSON.stringify(jsonDataString.props.pageProps.locations)
    const data = JSON.parse(dataString)
    let entities = []
    let count = 0
    for (const item of data) {
      entities.push({
        name: item.businessName,
        address: item.addressLines,
        postal_code : item.postalCode,
        phone : item.phoneNumbers,
        // workHours : item.formattedBusinessHours,
        latitude: item.latitude,
        longitude: item.longitude
      })
    }

    console.log('res-> ', entities[0])
    jsonData.entities = entities;

    return jsonData.entities;
    // fs.writeFileSync(`../2024-1-done/${savename}.json`, JSON.stringify(jsonData, null, 2));
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//call function processScraping
const finalData = await processScraping('HarveyNorman_nz');

//process json data into geojson format for spider platform
const features = finalData.map( prop => {
    return {
            "addr:full":prop.address,
            "addr:street":prop.street,
            "addr:city":prop.city,
            "addr:state":prop.state,
            "addr:country":"New Zealand",
            "addr:postcode":prop.postal_code,
            "name":prop.name,
            "Id":prop.id || uuidv4(),
            "phones":{
                "store":[prop.phone]},
            "fax":{"store":null},
            "store_url":prop.url,
            "website":start_urls,
            "operatingHours":{"store":prop.workHours},
            "services": prop.services || null,
            "chain_id": chain_id,
            "chain_name": chain_name,
            "brand": brand_name,
            "categories":categories,
            "foodtypes":foodtypes,
            "lat":prop.latitude,
            "lng":prop.longitude ,
        }
    
  });
  console.log ("{ item_scraped_count:" , features.length,"}")
  const logfile = `{ "item_scraped_count": ` +features.length + " }"
  const outputGeojson = GeoJSON.parse(features,{Point:['lat','lng'],removeInvalidGeometries:true});
      
  const geoExp = JSON.stringify(outputGeojson)
  fse.outputFileSync(`./output/${source}/${spider_name}/${dateformat}/${spider_name}.geojson`,geoExp)
  fse.outputFileSync(`./output/${source}/${spider_name}/${dateformat}/${spider_name}_log.json`,logfile)
