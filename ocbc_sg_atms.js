//import necessary modules and libraries
import axios from 'axios';
import GeoJSON from 'geojson';
import fse from 'fs-extra';
import { v4 as uuidv4 } from "uuid"; // Import v4 function as uuidv4
import { dateformat } from '../../scripts/date.js';

//update the following variables
const spider_name = "ocbc_sg_atms"
const start_urls = "https://www.ocbc.com/"
const brand_name = "OCBC"
const spider_type = "chain"
const source = "DPA_SPIDERS"
const chain_id = "6920"
const chain_name = "OCBC"
const categories = "700-7010-0108";
const foodtypes = null;

///////////////////////////////////////////////////////////////////////////////////////////////////////////////

const processScraping = async () => {
  const savename = "ocbc_sg_atms"
  console.log('start fetching')
  let jsonData = {
    siteId: '182',
    chainName: 'OCBC',
    ISO: 'SG',
    SN: '6920',
    category: 'Bank,ATM',
    url: 'https://www.ocbc.com/personal-banking/contact-us.page?search=310520&type=branch&p=1',
    entities: []
  }

  let htmlString = ``
  let entities = []
  let count = 0

  let url = `https://www.ocbc.com/iwov-resources/sg/ocbc/personal/data/atm.json?1712170525545`
            //`https://www.ocbc.com/iwov-resources/sg/ocbc/personal/data/branch.json?1712170525545` //branch

      const res = await axios.get(url)
      htmlString = res.data


      const dataString = htmlString
      const jsonDataString = JSON.stringify(dataString.data)
      const data = JSON.parse(jsonDataString)

      for (const item of data) {
        entities.push({
          name: item.title,
          address : item.address.replace("<br />", ""),
          postal_code : item.postcode,
          latitude : item.latitude,
          longitude : item.longitude
        })
      }
    

      console.log('res-> ', entities[0])
      jsonData.entities = entities;

      return jsonData.entities;
      // fs.writeFileSync(`../2024-1-done/${savename}.json`, JSON.stringify(jsonData, null, 2));
    };

    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//call function processScraping
const finalData = await processScraping('ocbc_sg_atms');

//process json data into geojson format for spider platform
const features = finalData.map( prop => {
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

