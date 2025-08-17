// here we will define the paths of the satellite that would appear rotating around our earth model
//for now we wil use dummy data
//later we will edit this function to return real satellite data using APIs

import { NextResponse } from "next/server";
//url to fetch tle data
const TLE_URL = "https://celestrak.org/NORAD/elements/gp.php?GROUP=starlink&FORMAT=tle";                //we are only fetching starlink because of cache error(>2mb files unable to cache on the nextjs server) 
                                                                                                        //earlier we were fetching entire celestrak data which was 2.7 mb and it was unable to cache on the server so we had to make new request to the celestrak server everytime we reloaded the page which led me to getting temporarily banned for making too many requests
//whats tle exactly?    
//tle is two line element set
//it is a standard text format for encoding satellite data
//it is like a snapshot that describes the satellite's exact path around the earth



//example of a real tle for iss
// ISS (ZARYA)
// 1 25544U 98067A   25229.54513889  .00006325  00000-0  12034-3 0  9994
// 2 25544  51.6416 234.3610 0006703 130.5360 340.3635 15.49548622464134
//first line contains information about how the satellite's orbit changes over time 
//second line tells about the core shape of the orbit with parameters like inclination, eccentricity(oval-ness) etc

// const satellites = [
//   {
//     name: "ISS (ZARYA)",
//     tleLine1: "1 25544U 98067A   24229.52083333  .00012345  00000-0  12345-3 0  9991",
//     tleLine2: "2 25544  51.6416 123.4567 0001234  123.4567 234.5678 15.50000000123456"
//   },
//   {
//     name: "HUBBLE SPACE TELESCOPE",
//     tleLine1: "1 20580U 90037B   24229.52083333  .00000456  00000-0  56789-4 0  9992",
//     tleLine2: "2 20580  28.4711 234.5678 0009876  345.6789 123.4567 15.10000000234567"
//   }
// ];




export async function GET(){
    try{
        const response = await fetch(TLE_URL, { next: { revalidate: 3600 } });        //we want 1 hour data ? why are we writing revalidate?

        //revalidate tells nextjs server to fetch data from celestrak first time someone visits our page
        //then it caches the data for 1 hour that means we dont wanna bother the celestrak server everytime user makes a request or our components re render
        //so for 3600 seconds the data remains the same and backend doesnt fetch new data

        //we can use this data to orient our satellites accorindly and re-adjust after each our to make sure the orbits remain true to the actual satellites




        if(!response){
            throw new Error('Failed to fetch satellite tle data');
        }
        const tleData=await response.text();

        //rn we are sending the entire text data to the frontend
        //we'll parse this data on the client side
        //we'll have to parse the data here only because downloading data of thousands of satellites and sending them to our fromtend is cumbersome 

        //writing the same logic that we wrote on the page.tsx for filtering and getting only two satellite data for now



        const tleLines = tleData.split('\n');       ////here each line of the text data become an array element which is much easier to manage

        const satellites = [];

         for(let i=0;i<tleLines.length;i+=3){            //we incrememnt by 3 here because we know tle data is in groups of 3

          const name = tleLines[i].trim();              //what does this trim do? 
          //The .trim() function is a standard JavaScript method for strings. Its only job is to remove any accidental whitespace (spaces, tabs, newlines) from the beginning and end of a string. We use it on the satellite's name to make sure it matches 'ISS (ZARYA)' perfectly, even if the original data had an extra space like " ISS (ZARYA) ".

            // console.log(name);                   can be used to set the satellite names below, just log the names of all the satellites present at the server and copy them below into the if condition



          if(name === 'STARLINK-34571' || name ==='STARLINK-34577' || name==='STARLINK-34758' || name==='STARLINK-34647'){
            const tleLine1 = tleLines[i+1].trim();             //get the next line which contains how the orbit changes due to atmospheric drag
            const tleLine2 = tleLines[i+2].trim();             //get the next to next line which contains the inclination,eccenttricity etc of the satellite

            satellites.push({
                name,
                tleLine1,
                tleLine2
            });
    
          }

        }


        return NextResponse.json({satellites});


    }
catch (error) {
    console.error('Error fetching TLE data:', error);
    return NextResponse.json(
      { success: false, message: 'Error fetching TLE data' },
      { status: 500 }
    );
  }
}
