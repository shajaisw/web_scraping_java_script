//import necessary modules and libraries
import axios from 'axios';
import GeoJSON from 'geojson';
import fse from 'fs-extra';
import { v4 as uuidv4 } from "uuid"; // Import v4 function as uuidv4
import { dateformat } from '../../scripts/date.js';

//update the following variables
const spider_name = "sc_sg_atms"
const start_urls = "https://www.sc.com/sg"
const brand_name = "Standard Chartered"
const spider_type = "chain"
const source = "DPA_SPIDERS"
const chain_id = "2529"
const chain_name = "Standard Chartered"
const categories = "700-7010-0108";
const foodtypes = null;

///////////////////////////////////////////////////////////////////////////////////////////////////////////////

const processScraping = async () => {
  const savename = "sc_sg_atms";
  console.log('start fetching')
  let jsonData = {
    siteId: '183',
    chainName: 'Standard Chartered',
    ISO: 'SG',
    SN: '2529',
    category: 'ATM',
    url: 'https://www.sc.com/sg/atm-branch-locator/',
    entities: []
  }

  let jsonString = ``

    const res = await axios.get('https://www.sc.com/sg/data/atm-branch/all-atms-branches.json')
    jsonString = res.data
    const totalData = jsonString
    const data = totalData.locations
    let entities = []
    let count = 0

    for (const item of data) {
      entities.push({
        id : item.id ,
        name: item.name,
        address: item.address.replace("\u000b", ' '),
        latitude: item.latitude,
        longitude: item.longitude,
        types : item.types
      })
    }
    console.log('res-> ', entities[0])

    jsonData.entities = entities;
    
    return jsonData.entities;
// fs.writeFileSync(`../2024-1-done/${savename}.json`, JSON.stringify(jsonData, null, 2));
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//call function processScraping
const finalData = await processScraping('sc_sg_atms');

//using filter to fetch atm data 
const filterType = finalData.filter(prop => prop.types[0] === "atm5" || prop.types[0] === "atm" || prop.types[0] === "cdm");

//process json data into geojson format for spider platform
const features = filterType.map( prop => {
    return {
            "addr:full":prop.address,
            "addr:street":prop.street,
            "addr:city":prop.city,
            "addr:state":prop.state,
            "addr:country":"Singapore",
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


