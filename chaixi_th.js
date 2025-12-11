import axios from 'axios';
import GeoJSON from 'geojson';
import fse from 'fs-extra';
import { v4 as uuidv4 } from "uuid";
import { dateformat } from '../scripts/date.js';

const spider_name = "chaixi_th"
const start_urls = "https://chaixi.co.th/"
const brand_name = "chaixi"
const spider_type = "chain"
const source = "DPA_SPIDER_SEA"
const chain_id = "7120"
const chain_name = "chaixi"
const categories = "200-2100-0019";
const foodtypes = null;

const processScraping = async () => {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

  const savename = 'chaixi_th'
  console.log('start fetching')
  let jsonData = {
    siteId: '267',
    chainName: 'chaixi',
    ISO: 'THA',
    SN: '',
    category: '',
    url: 'https://chaixi.co.th/newweb/search-chaixi-branch-and-street-food/',
    entities: []
  }

  let jsonString = ``
  let url = `https://chaixi.co.th/newweb/wp-json/wpgmza/v1/features/base64eJyrVkrLzClJLVKyUqqOUcpNLIjPTIlRsopRMoxRqlWqBQCnUQoG`

      const res = await axios.get(url)
      jsonString = res.data


    const jsonDataString = jsonString
    const dataString = JSON.stringify(jsonDataString.markers)
    const data = JSON.parse(dataString)

    console.log('data-> ', jsonDataString[0])
    let entities = []
    let count = 0
    for (const item of data) {
      entities.push({
        id : item.id,
        name: jsonData.chainName,
        address : item.address,
        latitude: item.lat,
        longitude: item.lng
      })
    }

    console.log('res-> ', entities[0])
    jsonData.entities = entities
    return jsonData.entities;
};

const finalData = await processScraping();
  const features = finalData.map( prop => {
    return {
            "addr:full":prop.address,
            "addr:street":prop.street,
            "addr:city":prop.city,
            "addr:state":prop.state,
            "addr:country":"Thailand",
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
