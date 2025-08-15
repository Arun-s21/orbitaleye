// here we will define the paths of the satellite that would appear rotating around our earth model
//for now we wil use dummy data
//later we will edit this function to return real satellite data using APIs

import { NextResponse } from "next/server";

export async function GET(){

    const satelliteData = [

        
        {

            id:'sat1',
            name:'satellite alpha',
            color:'red',
            orbit:{
                radius:1.5,
                speed:0.8,
                inclination:0.2,            //tilt on the x-axis
            },



        },

        {

            id:'sat2',
            name:'satellite beta',
            color:'blue',
            orbit:{
                radius:1.8,
                speed:0.6,
                inclination:0.5,
            },



        },


        {

            id:'sat3',
            name:'satellite gamma',
            color:'green',
            orbit:{
                radius:2.2,
                speed:0.4,
                inclination:1.2,
            },



        }

    ];

    return NextResponse.json({satellites:satelliteData});



}