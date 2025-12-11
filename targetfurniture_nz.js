//import necessary modules and libraries
import axios from "axios";
import fetch from "node-fetch";
import * as cheerio from 'cheerio'
import GeoJSON from 'geojson';
import fse from 'fs-extra';
import { v4 as uuidv4} from "uuid"; // Import v4 function as uuidv4
import { dateformat } from '../scripts/date.js';

//update the following variables
const spider_name = "targetfurniture_nz"
const start_urls = "https://www.targetfurniture.co.nz/"
const brand_name = "Target"
const spider_type = "chain"
const source = "DPA_SPIDERS"
const chain_id = "2680"
const chain_name = "Target"
const categories = "600-6200-0063";
const foodtypes = null;

const processScraping = async () => {
    // Configure axios to ignore SSL certificate validation errors
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

    const savename = 'targetfurniture_nz';
    console.log('start fetching');
    let jsonData = {
        siteId: '342',
        chainName: 'Target',
        ISO: 'NZL',
        SN: '2680',
        category: 'Department Store',
        url: 'https://www.targetfurniture.co.nz/store-locator',
        entities: []
    };

    try {
        const res = await fetch(jsonData.url);
        const htmlString = await res.text();
        const $ = cheerio.load(htmlString);
        let entities = [];

        // Select the fifth div in the document
        const branchRoot = $('div:nth-of-type(5), div:nth-of-type(4)');

        // Iterate over the selected elements
        await Promise.all(branchRoot.map(async (index, element) => {
            // Select the 'a' tag within the div and get its 'href' attribute
            const link = $(element).find('a').attr('href');

            // Convert relative URL to absolute URL
            const absoluteLink = new URL(link, jsonData.url).href;

            // Perform actions with the link
            // Here, we call parseDetailPage to process the detail page
            if (absoluteLink) {
                const detailEntity = await parseDetailPage(absoluteLink);
                if (detailEntity && detailEntity.name) { // Check if name is not empty
                    entities.push(detailEntity);
                }
            }
        }).get());

        jsonData.entities = entities;

        console.log('Scraping completed successfully.');
        return jsonData.entities;

    } catch (error) {
        console.error('Error occurred during scraping:', error);
    }
};

// Function to parse detail page
const parseDetailPage = async (link) => {
    try {
        // Skip mailto and tel URLs
        if (link.startsWith('mailto:') || link.startsWith('tel:')) {
            console.warn(`Skipping unsupported URL scheme: ${link}`);
            return null;
        }

        const response = await fetch(link);
        const htmlString = await response.text();
        const $ = cheerio.load(htmlString);

        const name = $('div.contact-address-store > h3').text();
        const address = $('div.contact-address-store > div').eq(0).text();
        const phone = $('div.contact-address-store > div > a > span').eq(1).text();
        const hours = $('div.contact-address-hours > table').eq(0).text();

        if (!name) { // Skip if name is empty
            return null;
        }

        return {
            name: name.trim(),
            phone: phone.trim(),
            address: address.trim(),
            hours: convertHours(hours.trim()),
            storeUrl: link
        };
    } catch (error) {
        console.error('Error occurred during detail page parsing:', error);
        return null;
    }
};

function convertHours(str){
    str = str.replace(/Monday/g, "Mo ");
    str = str.replace(/Tuesday/g, "Tu ");
    str = str.replace(/Wednesday/g, "We ");
    str = str.replace(/Thursday/g, "Th ");
    str = str.replace(/Friday/g, "Fr ");
    str = str.replace(/SaturdayClosed/g, "Sa Closed; ");
    str = str.replace(/SundayClosed/g, "Su Closed");
    str = str.replace(/pm/g, 'pm; ');
    str = str.replace(/Saturday/g, "Sa ");
    str = str.replace(/Sunday/g, "Su ");
    str = str.replace(/; $/g, '');

    //Convert Hours 
    str = str.replace(/(\d+):(\d+)\s*am/g, (match, p1, p2) => `${p1.padStart(2, '0')}:${p2}`);
    str = str.replace(/(\d+):(\d+)\s*pm/g, (match, p1, p2) => `${Number(p1) + 12}:${p2}`);

    return str;
}

// if (!finalData || finalData.length === 0) {
//     console.error("No data was scraped. Exiting the process.");
//     process.exit(1);  // Exit the script with an error code
// }

//GeoCoding
const jsondata = await processScraping()

const date = new Date();
const dateformate =
  date.getFullYear() +
  ("0" + (date.getMonth() + 1)).slice(-2) +
  ("0" + date.getDate()).slice(-2) +
  "." +
  ("0" + date.getHours()).slice(-2) +
  ("0" + date.getMinutes()).slice(-2) +
  ("0" + date.getSeconds()).slice(-2);

const saveFile = "targetfurniture_nz";
const country = "New Zealand";

//remove duplicate
const uniqueData = jsondata.reduce((acc, curr) => {
  const existingItem = acc.find((item) => item.name === curr.name);
  if (!existingItem) {
    acc.push(curr);
  }
  return acc;
}, []);
        
const searchtext = uniqueData.map(prop => { return prop.name });
console.log(searchtext.length);
const apiKey = "1FjCffkxMB7b70TZ2-oBUFCp7qkdG7NWLKAbD1qk5Sg";

async function executeSearchTexts() {
const items = [];

for (const text of searchtext) {
  try {
    const url = `https://geocode.search.hereapi.com/v1/geocode?q=${text}&apiKey=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();

    const resultItem = data.items[0];
    const address2 = resultItem.address.label;
    const resultType = resultItem.resultType;
    let lat = null;
    let lng = null;

    // Check resultType and set lat/lng accordingly
    if (resultType === "place" || resultType === "houseNumber") {
      lat = resultItem.position.lat;
      lng = resultItem.position.lng;
    }

    const returnData = {
      address2,
      resultType,
      lat,
      lng,
    };

    items.push(returnData);
    } catch (error) {
      const returnData = {
      address2: "Not Found",
      resultType: "Not Found",
      lat: null,
      lng: null,
    };
    items.push(returnData);
    }
  }
  return items;
};

const returnResults = await executeSearchTexts();
console.log(returnResults);

// Modify the merging logic to ensure lat/lng are correctly handled
const mergedData = uniqueData.map((prop, index) => {
const result = returnResults[index];

// Conditionally set lat/lng based on resultType
const lat = (result.resultType === "place" || result.resultType === "houseNumber") ? result.lat : null;
const lng = (result.resultType === "place" || result.resultType === "houseNumber") ? result.lng : null;

return {
  ...prop,
  address2: result.address2,
  restultype: result.resultType,
  lat,
  lng,
  };
});

// Use mergedData for further processing
console.log(mergedData);

// Update latitudes and longitudes based on updatedLocations
const finalData = mergedData.map(prop => {               
  return prop;
});

const features = finalData.map(prop => {
  return {
    "addr:full": prop.address,
    "addr:street": prop.address,
    "addr:city": prop.city,
    "addr:state": prop.province,
    "addr:country": "New Zealand",
    "addr:postcode": prop.postCode,
    "name": prop.name,
    "Id": prop.id || uuidv4(),
    "phones": { "store": [prop.phone] },
    "fax": { "store": prop.fax },
    "store_url": prop.url,
    "website": start_urls,
    "operatingHours": { "store": prop.hours },
    "services": null,
    "chain_id": chain_id,
    "chain_name": chain_name,
    "brand": brand_name,
    "categories": categories,
    "foodtypes": foodtypes,
    "lat": prop.lat, // Ensure lat and lng are assigned from merged data
    "lng": prop.lng,
  };
});        

console.log("{ item_scraped_count:", features.length, "}");
const logfile = `{ "item_scraped_count": ${features.length} }`;
const outputGeojson = GeoJSON.parse(features, { Point: ['lat', 'lng'], removeInvalidGeometries: true });

const geoExp = JSON.stringify(outputGeojson);
fse.outputFileSync(`./output/${source}/${spider_name}/${dateformat}/${spider_name}.geojson`, geoExp);
fse.outputFileSync(`./output/${source}/${spider_name}/${dateformat}/${spider_name}_log.json`, logfile);




