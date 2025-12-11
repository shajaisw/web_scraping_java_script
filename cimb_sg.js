//doubt

//import necessary modules and libraries
import axios from "axios";
import fetch from "node-fetch";
import * as cheerio from 'cheerio'
import GeoJSON from 'geojson';
import fse from 'fs-extra';
import { v4 as uuidv4 } from "uuid";
import { dateformat } from '../scripts/date.js';

const spider_name = "cimb_sg"
const start_urls = "https://www.cimb.com.sg/"
const brand_name = "CIMB BANK"
const spider_type = "chain"
const source = "DPA_SPIDER_SEA"
const chain_id = "7087"
const chain_name = "CIMB BANK"
const categories = "700-7000-0107";
const foodtypes = null;

//////////////////////////////////////////////////////////////////////////////////////
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
axios.defaults.headers.common["User-Agent"] = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3";
axios.defaults.headers.common["Content-Type"] = "application/json";
axios.defaults.headers.common["Accept"] = "application/json";
axios.defaults.headers.common["Accept-Encoding"] = "gzip, deflate, br";
axios.defaults.headers.common["Connection"] = "keep-alive";
axios.defaults.headers.common["Cache-Control"] = "no-cache";
axios.defaults.headers.common["Pragma"] = "no-cache";
axios.defaults.headers.common["Upgrade-Insecure-Requests"] = "1";
axios.defaults.headers.common["Sec-Fetch-Dest"] = "document";
axios.defaults.headers.common["Sec-Fetch-Mode"] = "navigate";
axios.defaults.headers.common["Sec-Fetch-Site"] = "none";
axios.defaults.headers.common["Sec-Fetch-User"] = "?1";
axios.defaults.headers.common["Sec-Fetch-User"] = "?1";

const processScraping = async () => {
  const savename = 'cimb_sg'
  console.log('start fetching')
  let jsonData = {
    siteId: '188',
    chainName: 'CIMB BANK',
    ISO: 'SGP',
    SN: '7087',
    category: 'Bank,ATM',
    url: 'https://www.cimb.com.sg/en/personal/help-support/branch-locator.html',
    entities: []
  }

  const res = await fetch('https://www.cimb.com.sg/en/personal/help-support/branch-locator/_jcr_content/root/responsivegrid_1379637002/branch_locator.data');
  const jsonString = await res.json();
  const dataString = jsonString;
  const dataSource = dataString.location[0].areas[0].branches;
  // console.log(dataSource)
  const data = dataSource;
  let entities = [];
  
  for (const item of data) {
    const hoursDesc = item.branchOperatingHoursDesc.replace(/<[^>]*>|&nbsp;/g, "").split('\r\n').map(line => line.trim());
    
    const branchOperatingHours = hoursDesc.filter(hour => 
      hour.includes('Monday – Friday') ||
      hour.includes('Saturday') ||
      hour.includes('Closed on Sunday and Public Holiday')
    );

    const convertedHours = branchOperatingHours.map(hour => convertHours(hour));
    entities.push({
      name: item.branchName,
      address : item.branchAddress,
      workHours : convertedHours,
      latitude: item.latitude,
      longitude: item.longitude,
      type: item.atmOperatingHoursDesc.replace(/<[^>]*>?/gm, '').trim(),
    })
  }
  console.log('res-> ', entities[0]);
  jsonData.entities = entities;
  return jsonData.entities;
  // fs.writeFileSync(`../2024-1-done/${savename}.json`, JSON.stringify(jsonData, null, 2));
};

function convertHours(str){
  str = str.replace(/Monday – Friday:/g, 'Mo-Fr');
  str = str.replace(/Saturday:/g, 'Sa');
  str = str.replace(/Closed on Sunday and Public Holiday/g, 'Su, PH Closed');
  str = str.replace(/ – /g, '-');

  str = str.replace(/(\d+):(\d+)\s*am/g, (match, p1, p2) => `${p1.padStart(2, '0')}:${p2}`);
  str = str.replace(/(\d+):(\d+)\s*pm/g, (match, p1, p2) => `${Number(p1) + 12}:${p2}`);

  return str;
}

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
                "store":[prop.phone]},
            "fax":{"store":null},
            "store_url":prop.url,
            "website":start_urls,
            "operatingHours":{"store": prop.workHours},
            "services": prop.type || null,
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
      
  const geoExp = JSON.stringify(outputGeojson)
  fse.outputFileSync(`./output/${source}/${spider_name}/${dateformat}/${spider_name}.geojson`,geoExp)
  fse.outputFileSync(`./output/${source}/${spider_name}/${dateformat}/${spider_name}_log.json`,logfile)

