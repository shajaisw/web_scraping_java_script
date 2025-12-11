import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import GeoJSON from 'geojson';
import fse from 'fs-extra';
import { v4 as uuidv4 } from "uuid";
import { dateformat } from '../scripts/date.js';

const spider_name = "hoyts_nz"
const start_urls = "https://www.hoyts.co.nz/"
const brand_name = "Hoyts"
const spider_type = "chain"
const source = "DPA_SPIDER_SEA"
const chain_id = "7120"
const chain_name = "Hoyts"
const categories = "200-2100-0019";
const foodtypes = null;

const processScraping = async () => {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

    console.log('start fetching')
    const savename = 'hoyts_nz'
    let jsonData = {
        siteId: '352',
        chainName: 'Hoyts',
        ISO: 'NZL',
        SN: '200-2100-0019',
        category: 'Cinema',
        url: 'https://www.hoyts.co.nz/cinemas',
        entities: []
    }

    let htmlString = ``
  
            const res = await fetch("https://apim.hoyts.co.nz/nz/cinemaapi/api/cinemas", {
                "headers": {
                  "accept": "application/json, text/plain, */*",
                  "accept-language": "en-US,en;q=0.9",
                  "priority": "u=1, i",
                  "sec-ch-ua": "\"Google Chrome\";v=\"125\", \"Chromium\";v=\"125\", \"Not.A/Brand\";v=\"24\"",
                  "sec-ch-ua-mobile": "?0",
                  "sec-ch-ua-platform": "\"Windows\"",
                  "sec-fetch-dest": "empty",
                  "sec-fetch-mode": "cors",
                  "sec-fetch-site": "same-site",
                  "Referer": "https://www.hoyts.co.nz/",
                  "Referrer-Policy": "strict-origin-when-cross-origin"
                },
                "body": null,
                "method": "GET"
              });
            htmlString = await res.json()
   
        const $ = cheerio.load(htmlString);

        let entities = []
        let count = 0

        for (let i = 0; i < htmlString.length; i++) {
            const name = htmlString[i].name
            const latitude = htmlString[i].latitude
            const longitude = htmlString[i].longitude
            const address = htmlString[i].address
            const storeUrl = htmlString[i].link
            entities.push({
                name: name.trim(),
                address: address,
                latitude: latitude,
                longitude: longitude,
                storeUrl: storeUrl
            })
        }
        console.log('res-> ', entities[1])

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
            "addr:country":"New Zealand",
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

