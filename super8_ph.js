//import necessary modules and libraries
import axios from "axios";
import * as cheerio from 'cheerio'
import GeoJSON from 'geojson';
import fse from 'fs-extra';
import { v4 as uuidv4 } from "uuid"; // Import v4 function as uuidv4
import { dateformat } from '../scripts/date.js';

//update the following variables
const spider_name = "super8_ph"
const start_urls = "https://super8.ph/"
const brand_name = "Super8 Grocery"
const spider_type = "chain"
const source = "DPA_SPIDERS"
const chain_id = "35871"
const chain_name = "Super8 Grocery"
const categories = "600-6300-0066";
const foodtypes = null;

//////////////////////////////////////////////////////////////////////////////////////

const processScraping = async () => {
  // Configure axios to ignore SSL certificate validation errors
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

  const savename = "super8_ph"
  console.log('start fetching')
  let jsonData = {
    siteId: '288',
    chainName: 'Super8 Grocery',
    ISO: 'PHL',
    SN: '35871',
    category: 'Grocery',
    url: 'https://super8.ph/store-locator',
    entities: []
  }

  let jsonString = ``;
  //let url = ``;

  try {
    const res = await fetch("https://super8.ph/branches/fetch", {
      "headers": {
        "accept": "application/json, text/plain, */*",
        "accept-language": "en-US,en;q=0.9",
        "content-type": "application/json;charset=UTF-8",
        "sec-ch-ua": "\"Google Chrome\";v=\"125\", \"Chromium\";v=\"125\", \"Not.A/Brand\";v=\"24\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"Windows\"",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "x-csrf-token": "XDaBuAMxsvMjjw3LkWS7ng2UPdn4qaaJv75oGCya",
        "x-requested-with": "XMLHttpRequest",
        "x-xsrf-token": "eyJpdiI6IjlocHlGR0NFc0tWK0gzUmFBQzBtdmc9PSIsInZhbHVlIjoibGZMeGY2MzZVc2tYQXJta1FwaGRJQk9YQytZb2xhS3l6ZlhlaXNBMld5dEQvR1ZITG95UE5jMllrQWpMY1dGWHczVWh3QWdoWG9aSFVLRkdxYTN1cU02UDJ5a2JKZkUvV1ZXTHJKaldXS0dLbE8vQzN0eWtkSUVhTllka0o0MGUiLCJtYWMiOiIyZDJkNmVmNmNhMTA1YzZlZTFkZmY2NGVkOTBlOWVkZDA5YTU1YjY3N2ZmYjA0MTQ4ZTU3NWY4ZTlhY2ZiNmNhIiwidGFnIjoiIn0=",
        "cookie": "XSRF-TOKEN=eyJpdiI6IjlocHlGR0NFc0tWK0gzUmFBQzBtdmc9PSIsInZhbHVlIjoibGZMeGY2MzZVc2tYQXJta1FwaGRJQk9YQytZb2xhS3l6ZlhlaXNBMld5dEQvR1ZITG95UE5jMllrQWpMY1dGWHczVWh3QWdoWG9aSFVLRkdxYTN1cU02UDJ5a2JKZkUvV1ZXTHJKaldXS0dLbE8vQzN0eWtkSUVhTllka0o0MGUiLCJtYWMiOiIyZDJkNmVmNmNhMTA1YzZlZTFkZmY2NGVkOTBlOWVkZDA5YTU1YjY3N2ZmYjA0MTQ4ZTU3NWY4ZTlhY2ZiNmNhIiwidGFnIjoiIn0%3D; super8_session=eyJpdiI6ImY4aDgybmZYUFdyWWxld3N6TGpEM1E9PSIsInZhbHVlIjoieTdzNkxBZFZ4L25TT1ZHdFhDYnF5WmZ1cGxwWkFMYWRhV0JwZnlkZlk3TEpqK3hKSmk4WmtmeVlQU3ZISER4OEZKTERVMCtndWVmVVUyY1RCL0tpZHl4OWlxRWNqWnZwYS85bHBzSHhsaGc2U3N5eDZVbkgyb3JYTUVBNVVaa0giLCJtYWMiOiIzN2JlYjEzYjUzOWFjZTU2OTMzOTg1ZjdlMjY4Nzg0ZTI1ZWU4MTc2ZDFhMjQ1YTNjOTM2MGZhMmRiMDkzNTM1IiwidGFnIjoiIn0%3D",
        "Referer": "https://super8.ph/store-locator",
        "Referrer-Policy": "strict-origin-when-cross-origin"
      },
      "body": "{\"province\":null,\"type\":null,\"store\":null}",
      "method": "POST"
    });

    if (!res.ok) {
      throw new Error(`HTTP error! Status: ${res.status}`);
    }

    jsonString = await res.json();

    console.log("Response body:", jsonString);

    const data = jsonString;
    let entities = []
    let count = 0
    for (const item of data) {
      entities.push({
        id: item.id,
        name: item.name,
        address: item.full_address,
        city: item.city,
        state: item.province,
        workHours: item.store_hours,
        email: item.contact_email_address,
        phone: item.contact_mobile_number,
        latitude: item.latitude,
        longitude: item.longitude
      })
    }

    console.log('res-> ', entities[0])
    jsonData.entities = entities
    // fs.writeFileSync(`../2024-1-done/${savename}.json`, JSON.stringify(jsonData, null, 2));
  } catch (error) {
    console.error('Error fetching data:', error);
  }
};

processScraping();




