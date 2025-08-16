// here we will define the paths of the satellite that would appear rotating around our earth model
//for now we wil use dummy data
//later we will edit this function to return real satellite data using APIs

import { NextResponse } from "next/server";
//url to fetch tle data
const TLE_URL = 'https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=tle';

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




export async function GET(){
    try{
        const response = await fetch(TLE_URL, {next:{revalidate:3600}});        //we want 1 hour data ? why are we writing revalidate?

        //revalidate tells nextjs server to fetch data from celestrak first time someone visits our page
        //then it caches the data for 1 hour that means we dont wanna bother the celestrak server everytime user makes a request or our components re render
        //so for 3600 seconds the data remains the same and backend doesnt fetch new data

        //we can use this data to orient our satellites accorindly and re-adjust after each our to make sure the orbits remain true to the actual satellites



        
        if(!response){
            throw new Error('Failed to fetch satellite data');
        }
        const tleData=await response.text();

        //rn we are sending the entire text data to the frontend
        //we'll parse this data on the client side
        
        return NextResponse.json({tleData});


    }
catch (error) {
    console.error('Error fetching TLE data:', error);
    return NextResponse.json(
      { success: false, message: 'Error fetching TLE data' },
      { status: 500 }
    );
  }
}
