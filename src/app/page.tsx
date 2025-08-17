'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import axios from 'axios';
import * as satellite from 'satellite.js';

// Define a type for our satellite data to make the code safer
// type Satellite = {
//   id: string;
//   name: string;
//   color: number;
//   orbit: {                         //it was used when we were fetching dummy data from our backend
//     radius: number;
//     speed: number;
//     inclination: number;
//   };
// };


function makeTextSprite(message: string) {                              //function to give labels(names) to each satellite, we are using Three.Sprite 
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d")!;
  context.font = "24px Arial";
  context.fillStyle = "white";
  context.fillText(message, 4, 24);       

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(0.5, 0.25, 1); // adjust size
  return sprite;
}




type SatelliteObject = {

  mesh:THREE.Mesh;        //what is THREE.mesh ?It is a regular 3d object
  // A THREE.Mesh is the most common type of object in Three.js. It's simply an object that has a shape (a Geometry) and an appearance (a Material). It's the final, visible "actor" that you place on the stage.


  satrec:any;             //satellite record from satellite.js, it is a special object that contains a function that performs all the complex math operations on the satellite data to give its orbit and other details
  name:string; 
  originalColor:THREE.Color;                      //to remember the color of each satellite to reinstate after satellites move away from danger zone 
  label:THREE.Sprite;                             // THREE.Sprite is a special type of object in Three.js that is a 2D plane that always faces the camera.


}

export default function HomePage() {
  const mountRef = useRef<HTMLDivElement>(null);
  // 1. New state to store our satellite data
  const [satellites, setSatellites] = useState<SatelliteObject[]>([]);        //empty array for now with type as above defined satelliteObject
  const[satelliteSpeed,setSatelliteSpeed] = useState(60);                     //new state to make the slider component to adjust satellite speed from the client side

  





  // 2. This useEffect fetches the data from our API

  //Fetching the tle set data from our backend, rn its raw text we will have to parse it

  //data has three lines--name,its orbit varying data and its orbit parameters

  //we will have to split data into individual lines of array
  //then for each satellite read its next two lines and process that data
  useEffect(() => {

    const initializeSatellites = async()=>{

      try{
        const response = await axios.get('/api/orbits');
        const satelliteData = response.data.satellites;

        //creating satellite meshes now-------
        const processedSatellites = satelliteData.map((sat: any) => {
          const color = new THREE.Color(Math.random() * 0xffffff);

          const mesh = new THREE.Mesh(
            new THREE.SphereGeometry(0.05, 16, 16),
            new THREE.MeshBasicMaterial({ color: color })                       //set a random color for each satellite in the scene
          );

          // Create the physics model from the provided lines
          const satrec = satellite.twoline2satrec(sat.tleLine1, sat.tleLine2);

          // Create a 3D label for each satellite using your new function
          const label = makeTextSprite(sat.name);
          label.position.set(0, 0.1, 0); // Position it slightly above the satellite
          mesh.add(label); // Attach the label as a child of the satellite mesh




          return {
            mesh,
            satrec,
            name: sat.name,
            originalColor:color,
            label
          };
        });

        setSatellites(processedSatellites);




        // const satrecs = [];                             //empty array to store all the processed satellites to add to our scene later

       



        //     const satrec = satellite.twoline2satrec(tleLine1,tleLine2);       //this is the inbuilt function of satellite.js
        //                                                                       //it takes the raw two lines of the tle data then performs all the complex calculations to convert the data into special satrec object

        //     //this satrec object is the physics model that we can use to predict satellite's position at any given time 



        //     satrecs.push({satrec,name});                       //add the satellite to our satrecs array

        //   }


        // }

        // setSatellites(satrecs.map(s=>({
        //   mesh:new THREE.Mesh(
        //     new THREE.SphereGeometry(0.05,8,8),                         //creating the geometry for each satellite, gray color for each satellite for now
        //     new THREE.MeshBasicMaterial({color:'gray'})

        //   ),
        //   satrec:s.satrec,                                              //physics model which would be used fpr calulating the position of each satellite
        //   name:s.name,                                  


        // })));



      } catch(error){
        console.error('Failed to fetch satellite data: ',error);
      }



    };

    initializeSatellites();




  }, []); // Runs once on page load to fetch the satellite data present at the backend










  // 3. This useEffect builds the 3D scene *after* we have the data
  useEffect(() => {
    if (!mountRef.current || satellites.length === 0) return;

    const currentMount = mountRef.current;


    //three.js has four major concepts that we need to remember 
        //1.The scene setup-- it is the main stage where out animations play out
        //2.The main actor(earth in our case)
        //3.The animation-- animate function's job is to run in a continous loop over and over again, to create illusion of movement
        //4.renderer.render--  it tells the to render the scene from camera's pov wherever we set the camera in out setup, this is the last command in the animate function






        // --- Scene Setup ---
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, currentMount.clientWidth / currentMount.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    currentMount.appendChild(renderer.domElement);

    // --- Earth & Lighting ---
    const earthGeometry = new THREE.SphereGeometry(1, 32, 32);
     const earthTexture = new THREE.TextureLoader().load(
    'https://threejs.org/examples/textures/land_ocean_ice_cloud_2048.jpg'
  );
  const earthMaterial = new THREE.MeshStandardMaterial({ map: earthTexture });
    const earth = new THREE.Mesh(earthGeometry, earthMaterial);
    scene.add(earth);
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0xffffff, 1);
    pointLight.position.set(5, 3, 5);
    scene.add(pointLight);



    //we did not give any coordinates to our main actor(earth) so it is by default placed at (0,0,0) i.e the center of our stage








    // --- 4. DYNAMIC Satellites & Orbits ---
    // const satelliteObjects: THREE.Mesh[] = [];                                          //array to store satellites from fetched from our backend 
    
    

    // satellites.forEach(satData => {                                                     //we are looping through the sattelites object that we received from the backend here
    //   const satGeometry = new THREE.SphereGeometry(0.05, 8, 8);                         //here we are giving the shape of the satellites i.e 0.5 radius circles
    //   const satMaterial = new THREE.MeshBasicMaterial({ color: satData.color });        //color that is stored inside satellites.color
    //   const satellite = new THREE.Mesh(satGeometry, satMaterial);                       //combining the shape and the color
    //   satelliteObjects.push(satellite);                                                 //adding the satellite to the satellite array here this would be used later for animating the satellites
    //   scene.add(satellite);                                                             //adding the created satellites to our scene                                 
    // });     


    satellites.forEach(sat=>scene.add(sat.mesh));



    // --- Controls ---
    const controls = new OrbitControls(camera, renderer.domElement);                    //cursor controls
    controls.enableDamping = true;
    camera.position.z = 5;

    // --- Animation loop ---
    


//------------------------------------------------------------------------------------------------
//------------------------------------------------------------------------------------------------


        // // Animate satellites based on the fetched data
        // satelliteObjects.forEach((sat, index) => {
        //     const satData = satellites[index];
        //     const time = Date.now() * 0.0001 * satData.orbit.speed;                    //here we are setting the speed of each satellite
            
        //     sat.position.x = Math.cos(time) * satData.orbit.radius;                    //setting the radius of each satellite's orbit
        //     sat.position.z = Math.sin(time) * satData.orbit.radius;
            
        //     // Apply the tilt (inclination)
        //     // const orbitPlane = new THREE.Object3D();                                  //since each satellite is now in the x-z plane we are setting the inclination here to separate each of their orbits through inlcination on the x-axis
        //     // orbitPlane.rotation.x = satData.orbit.inclination;                        //get the x-inclination from satellites.orbit.inclination
        //     // sat.position.applyEuler(orbitPlane.rotation);                             // this statement applies the different orbital tilts
        // });



        // //Collision detection logic---

        // const collisionThreshold = 0.5;                                               //if satellites get closer than this, we'll flag them as red

        // satelliteObjects.forEach((sat, index) => {
        //   (sat.material as THREE.MeshBasicMaterial).color.set(satellites[index].color);     //resetting each satellite to their original color first
        // });

        // //we are resetting color to original because we want the color of the satellites to be red only for the time they are below distanceThreshold in closeness
        // //because the animate function keeps them moving, we keep resetting them to original color and keep on checking their distance by looping through the satelliteObject array
        // //if they move further away then we set their color to original and the if condition of the color setting doesnt run and the satellites return to their original color






        // //now looping through each satellite and findind distance between them each time the animate functions runs(60 times per second)

        // for(let i=0;i<satelliteObjects.length;i++){
        //   for(let j=i+1;j<satelliteObjects.length;j++){
        //     const sat1 = satelliteObjects[i];
        //     const sat2 = satelliteObjects[j];

        //     // calculate distance
        //     const distance = sat1.position.distanceTo(sat2.position); 

        //     if(distance<collisionThreshold){
        //       (sat1.material as THREE.MeshBasicMaterial).color.set('red');      //setting both their colors red if the distance is less than threshold
        //       (sat2.material as THREE.MeshBasicMaterial).color.set('red');
        //     }


        //   }
        // }


        //animate function for dummy satellites that we fed through the backend earlier
//------------------------------------------------------------------------------------------------
//------------------------------------------------------------------------------------------------

 const startTime = Date.now();              //this variable stores the starting time(seconds) of the animation loop, it gives us a starting point to start our measurements from
 //new Date() gives us the miliseconds that has passed since 1970 which is a very huge number so we have to get the differnce of startTime and elapsedTime in the animation loop
    

//        NEW ANIMATE FUNCTION LOGIC
const animate = () => {
        requestAnimationFrame(animate);
        earth.rotation.y += 0.001;


        // console.log('Loaded satellites:', satellites.map(s => s.name));

const currentTime = Date.now();
//this line gets the exact miliseconds at every frame of the animation


const elapsedTime = (currentTime-startTime)/1000;       //time in seconds
const now = new Date(startTime + (elapsedTime*satelliteSpeed*1000));                                  //satellite.js needs a date object to calculate at which point in time to calculate the satellite's position etc so we need to create a date object 
//real time is 24 hours in a day but we need the clock to work faster so that satellites can move faster(animate function makes sure entire motion is completed in minutes)

//we are adding startTime because if we dont add the startTime the elapsedTime would be 0 when the first time animation loads since currentTime=startTime then const now =0
//this will create a new date object like new Date(0) which means it would give us a time in 1970, we are using the tle data of 2025, satellite.propagate function would then be asked to 
//calculate the satellite position in 1970 which would break the function
//so we add startTime so that the position of the satellite is always currentTime+minutesPassedInSimulation
//everytime animation function runs, it takes a new snapshot of the satellite positions according to the now date object and we can adjust the elapsedTime by adjusting the slider


//new Date(0) gives us a date object when we call it we are telling js to give us a date object exactly 0 milliseconds after 1 january 1970 which would be the 1970 date itself



//elapsedTIme*satelliteSpeed means lets say elapsed time=10 second and satellite speed =60 then we are telling our simulation that actually 600 seconds have passed inside the simulation *1000 turns it into milliseconds





satellites.forEach(sat=>{
  
  const positionAndVelocity = satellite.propagate(sat.satrec,now);        //this function takes  satellite's satrec physics model and current time and performs complex SGP4 calculations and returns the positon and velocity of the satellite at this moment
//Based on this satellite's orbital recipe (satrec), where in the sky would it be at the exact moment in time represented by this Date object (now)?"
 

  const positionEci = positionAndVelocity?.position;   
     

  //this function extract the x,y,z coordinates of the satellite in ECI(earth centric inertial system)--- "fixed" coordinate system where the stars don't move. The Earth spins inside this fixed grid

  const gmst = satellite.gstime(now);
  //this is the current rotation angle of the Earth. It's the key piece of information needed to switch between the two coordinate systems

  if(positionEci){
    const positionEcf = satellite.eciToEcf(positionEci,gmst);
    //coordinate system that is glued to the Earth and spins with it. A point on the surface (like your city) has a fixed coordinate in this system
  
                const scale = (1 / 6371)*2;           //we are setting scale positionEci gives us data in real world kilometers
                //we have to scale down it to fit into our 3d scene     we have taken our earth's radius to be 1 and real earth's radius is 6371 km so to scale properly we have to bring the coordinates into our system of calculation                     
                sat.mesh.position.set(                            //finally we muliply x,y,z coordinates by our scale factor to fit them into our scene 
                    positionEcf.x * scale,  
                    positionEcf.z * scale,                        //in ECI system, Z coordinate is actually the Y coordinate in three.js coordinate system so we set Y coordinate to the Z in ECI
                    -positionEcf.y * scale                        //we swap Y and Z axis and multiply it by -1 to correct the orientation accoriding to our camera
                );
            }
        });



        //COLLISION DETECTION LOGIC----------------------

        const collisionThreshold = 0.5;        //the least distance satellites can come close to each other before getting flagged red 



        satellites.forEach(sat => {
          (sat.mesh.material as THREE.MeshBasicMaterial).color.set(sat.originalColor);      //every frame revert the satellites back to their original color and check if they still are in the danger zone or not                                                                              
        });      
        
        
        // Now Loop through every unique pair of satellites
        for (let i = 0; i < satellites.length; i++) {
          for (let j = i + 1; j < satellites.length; j++) {
            const sat1 = satellites[i];
            const sat2 = satellites[j];

            //Calculate the distance between them
            const distance = sat1.mesh.position.distanceTo(sat2.mesh.position);

            // 4. If the distance is below the threshold, flag them as red
            if (distance < collisionThreshold) {
              (sat1.mesh.material as THREE.MeshBasicMaterial).color.set('red');
              (sat2.mesh.material as THREE.MeshBasicMaterial).color.set('red');
            }
          }
        }










       controls.update();
        renderer.render(scene, camera);
        //rendered takes the snapshot of our scene at this exact moment and shows it to us(draws it on the screen) this happens 60 times per second which gives us the illusion of animation
    };
        
    animate();


     // --- Cleanup ---
    return () => {
        currentMount.removeChild(renderer.domElement);
    };
  }, [satellites.length,satelliteSpeed]);                                                   //This code only runs when satellite state has some data i.e either a satellite is added or our frontend gets the satellite data that it has fetched from the backend in the previous useEffect

  return( <div ref={mountRef} className="w-full h-screen" >
         <div className="fixed top-4 left-4 bg-white rounded p-2 shadow">
        <label>Speed: {satelliteSpeed} sec/frame</label>
        <input
          type="range"
          min="1"
          max="1000"
          value={satelliteSpeed}
          onChange={(e) => setSatelliteSpeed(Number(e.target.value))}
        />
      </div>

  </div>
  );
}







        
    
   