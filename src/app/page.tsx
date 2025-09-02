'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import axios from 'axios';
import * as satellite from 'satellite.js';
import { AxiosError } from 'axios';


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



type CollisionAlert = {
  sat1: string;                               //type for out collision alert state variable
  sat2: string;
  distance: number;
} | null;







type SatelliteObject = {

  mesh:THREE.Mesh;        //what is THREE.mesh ?It is a regular 3d object
  // A THREE.Mesh is the most common type of object in Three.js. It's simply an object that has a shape (a Geometry) and an appearance (a Material). It's the final, visible "actor" that you place on the stage.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
  satrec:any;             //satellite record from satellite.js, it is a special object that contains a function that performs all the complex math operations on the satellite data to give its orbit and other details
  name:string; 
  originalColor:THREE.Color;                      //to remember the color of each satellite to reinstate after satellites move away from danger zone 
  label:THREE.Sprite;                             // THREE.Sprite is a special type of object in Three.js that is a 2D plane that always faces the camera.


}

export default function HomePage() {
  const mountRef = useRef<HTMLDivElement>(null);
  // 1. New state to store our satellite data
  const[satelliteSpeed,setSatelliteSpeed] = useState(60);                     //new state to make the slider component to adjust satellite speed from the client side
  const [collision,setCollision] = useState<CollisionAlert>(null);            //this state is defined so that when collision occurs, we save the names and distance of those two satellites in this state so that we can display the alert in the jsx using this value
  //for dynamic adding and removal of satellites 
  const[allSatellites,setAllSatellites] = useState<SatelliteObject[]>([]);         //this use state holds all the satellites that the backend sends
  const[activeSatellites,setActiveSatellites] = useState<SatelliteObject[]>([]);  //this state variable holds all the active satellites i.e satellites that the user has cliked on right nown
  const sceneRef = useRef(new THREE.Scene());                                     //whenever we add/remove satellites we dont want our entire scene to regenerate 
  //we have to use useRef for Earth and sun also to prevent re renders everytime we add or remove a satellite, every component needs to be a useRef now
  const earthGeometryRef = useRef(new THREE.SphereGeometry(1, 32, 32));
  const earthTextureRef = useRef<THREE.Texture | null>(null);

     

  const earthMaterialRef = useRef(new THREE.MeshStandardMaterial({ map: earthTextureRef.current }));
    const earthRef = useRef(new THREE.Mesh(earthGeometryRef.current, earthMaterialRef.current));


    const ambientLightRef = useRef(new THREE.AmbientLight(0xffffff, 0.8));                         //ambient light makes the earth appear and look brighter



  const sunGeometryRef = useRef(new THREE.SphereGeometry(10, 32, 32));
  const sunTextureRef = useRef<THREE.Texture | null>(null);

 

const sunMaterialRef = useRef(new THREE.MeshBasicMaterial({
  map: sunTextureRef.current}));
const sunRef = useRef(new THREE.Mesh(sunGeometryRef.current, sunMaterialRef.current));

//we cant use useRef inside a useEFfect so we had to take the neccesary constants outside

  useEffect(()=>{
      const earthLoader = new THREE.TextureLoader();                                           //const earthMaterialRef = useRef(new THREE.MeshStandardMaterial({ map: earthTextureRef.current }));
                                                                                              // const earthRef = useRef(new THREE.Mesh(earthGeometryRef.current, earthMaterialRef.current));
                                                                                              // At this point, earthTextureRef.current is still null (because textures are loaded later inside useEffect).
                                                                                              // That means your Earth mesh is created with no texture and never updated.

                                                                                              // Same issue for the Sun.
    const sunLoader = new THREE.TextureLoader();

     earthLoader.load("/earthTexture.jpg", (texture) => {
    earthTextureRef.current = texture;
    earthMaterialRef.current.map = texture;
    earthMaterialRef.current.needsUpdate = true;
  });

  // Load Sun texture
  sunLoader.load("/sunTexture.jpg", (texture) => {
    sunTextureRef.current = texture;
    sunMaterialRef.current.map = texture;
    sunMaterialRef.current.needsUpdate = true;
  });
    


      const spaceTextureLoader = new THREE.TextureLoader();
  spaceTextureLoader.load("/space-panorama.jpg", (texture) => {
    // This tells three.js how to wrap the 2D texture into a 3D sphere.
    texture.mapping = THREE.EquirectangularReflectionMapping;
    
    // Set the texture as the scene's background.
    sceneRef.current.background = texture;
  });


  },[]);
   




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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const processedSatellites = satelliteData.map((sat: any) => {
          const color = new THREE.Color(Math.random() * 0xffffff);

          const mesh = new THREE.Mesh(
            new THREE.SphereGeometry(0.05, 16, 16),
            new THREE.MeshBasicMaterial({ color: color })                       //set a random color for each satellite in the scene
          );

          // Create the physics model from the provided lines-----this is an important line--------
          const satrec = satellite.twoline2satrec(sat.tleLine1, sat.tleLine2);



          // Create a 3D label for each satellite using the new function
          const label = makeTextSprite(sat.name);
          label.position.set(0, 0.1, 0); // Position it slightly above the satellite
          mesh.add(label); // Attach the label as a child of the satellite mesh
          mesh.name=sat.name;                 //we are setting each satellite geometry's name to its satellite's name this is useful when we will find the satellites using satData.name in the dynamic adding of satellites later



          return {
            mesh,
            satrec,
            name: sat.name,
            originalColor:color,
            label
          };
        });

        setAllSatellites(processedSatellites);          //adding all the processed(completely rendered satellites) to our state variable



        //     const satrec = satellite.twoline2satrec(tleLine1,tleLine2);       //this is the inbuilt function of satellite.js
        //                                                                       //it takes the raw two lines of the tle data then performs all the complex calculations to convert the data into special satrec object

        //     //this satrec object is the physics model that we can use to predict satellite's position at any given time 




      } catch (err) {
        // FIX: Use a specific type for the error
        const error = err as AxiosError;
        console.error("Failed to fetch satellite data:", error.message);
      }


    };

    initializeSatellites();




  }, []); // Runs once on page load to fetch the satellite data present at the backend


  







  // 3. This useEffect builds the 3D scene *after* we have the data
  useEffect(() => {
    if (!mountRef.current || allSatellites.length === 0) return;

    const currentMount = mountRef.current;


    //three.js has four major concepts that we need to remember 
        //1.The scene setup-- it is the main stage where out animations play out
        //2.The main actor(earth in our case)
        //3.The animation-- animate function's job is to run in a continous loop over and over again, to create illusion of movement
        //4.renderer.render--  it tells the to render the scene from camera's pov wherever we set the camera in out setup, this is the last command in the animate function






        // --- Scene Setup ---
    const scene =  sceneRef.current;
    const camera = new THREE.PerspectiveCamera(75, currentMount.clientWidth / currentMount.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    currentMount.appendChild(renderer.domElement);

    // --- Earth & Lighting ---
   
    const earth = earthRef.current;
    scene.add(earth);
    const ambientLight = ambientLightRef.current;                         //ambient light makes the earth appear and look brighter
    scene.add(ambientLight);
    
    
const sun = sunRef.current;
sun.position.set(-100, 50, 100);
scene.add(sun);












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


   



    // --- Controls ---
    const controls = new OrbitControls(camera, renderer.domElement);                    //cursor controls
    controls.enableDamping = true;
    camera.position.z = 5;

  













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





activeSatellites.forEach(sat=>{
  
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

        //-----------------------------------
        //animating the sun revolution
        const sunOrbitSpeed = 0.00005;
        const sunOrbitRadius = 150;
        const time = Date.now();
        //x and z coordinate of sun, the plane in which sun will revolve in x-z axis
        const sunX = Math.cos(time*sunOrbitSpeed)*sunOrbitRadius;
        const sunZ = Math.sin(time*sunOrbitSpeed)*sunOrbitRadius;

        sun.position.set(sunX, 0, sunZ);



        //COLLISION DETECTION LOGIC----------------------

        const collisionThreshold = 1.0;        //the least distance satellites can come close to each other before getting flagged red 

        let collisionDetected = false;

        activeSatellites.forEach(sat => {
          (sat.mesh.material as THREE.MeshBasicMaterial).color.set(sat.originalColor);      //every frame revert the satellites back to their original color and check if they still are in the danger zone or not                                                                              
        });      
        
        
        // Now Loop through every unique pair of satellites
        for (let i = 0; i < activeSatellites.length; i++) {
          for (let j = i + 1; j < activeSatellites.length; j++) {
            const sat1 = activeSatellites[i];
            const sat2 = activeSatellites[j];

            //Calculate the distance between them
            const distance = sat1.mesh.position.distanceTo(sat2.mesh.position);

            // 4. If the distance is below the threshold, flag them as red
            if (distance < collisionThreshold) {
              (sat1.mesh.material as THREE.MeshBasicMaterial).color.set('red');
              (sat2.mesh.material as THREE.MeshBasicMaterial).color.set('red');

              //update the collision variable if collision is detected
              setCollision({
                sat1:sat1.name,
                sat2:sat2.name,
                distance:distance
              });

              collisionDetected=true;
              



            }
          }
        }


          if (!collisionDetected) {
          setCollision(null);
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
  }, [allSatellites,satelliteSpeed,activeSatellites]);                                                   //This code only runs when satellite state has some data i.e either a satellite is added or our frontend gets the satellite data that it has fetched from the backend in the previous useEffect




  //-----------------------------Dynamically adding satellites to our scene

  useEffect(()=>{
    
    activeSatellites.forEach(satData=>{
      const alreadyExists = sceneRef.current.getObjectByName(satData.name);
      if(!alreadyExists){
        sceneRef.current.add(satData.mesh);



      }


    })




  },[activeSatellites]);                      //whenever user clicks on a new satellite, activeSatellite changes and this useEffect runs and adds that satellite to our scene






  //------------------------------------------------logic to add set aciveSatellites such that same satellite is not added again and again to our scene

  function handleSatellite(satelliteToAdd:SatelliteObject){

    let isAlreadyAcive = false;                         //keeping a flag to check if the satellite already exists in our scene or not
    //we dont want a single satellite to get added again and again if the user clicks on it multiple times so we keep a check to make sure the satellite user is clicking doesnt exist in our scene already
    for(let i=0;i<activeSatellites.length;i++){         //looping through each satllite present in the activeSatellite array
      const activeSatellite = activeSatellites[i];      
      if(activeSatellite.name === satelliteToAdd.name){   //if the current satellite in the array has the same name as the satellite we want to add 
        isAlreadyAcive=true;                              //then set the flag to true
        break;                                            //break the loop
      }
    }

    if(!isAlreadyAcive){                      //if the satellite is not added i.e the flag is false 
      setActiveSatellites([...activeSatellites,satelliteToAdd]);        //... is spread syntax which brings all the array items present in the activeSaetllies array and then appends satelliteToAdd
    }

    if(isAlreadyAcive){                     //if the satellite is already in the scene i.e active then remove that satellite
      
      setActiveSatellites(activeSatellites.filter(
        (active)=>active.name!==satelliteToAdd.name
      ));
      const objectToRemove = sceneRef.current.getObjectByName(satelliteToAdd.name);
    if (objectToRemove) {
      sceneRef.current.remove(objectToRemove);
    }

    }

  }



  return (
    <div className="relative w-full h-screen bg-black">
     
      <div ref={mountRef} className="absolute top-0 w-full h-full" />

     
      <div>
      
        <div className="fixed top-4 left-4 bg-gray-900 bg-opacity-70 backdrop-blur-md text-gray-200 border border-gray-700 rounded p-2 shadow">
          <label className="text-sm font-semibold">Speed Multiplier: {satelliteSpeed}x</label>
          <input
            type="range"
            min="1"
            max="1000"
            value={satelliteSpeed}
            onChange={(e) => setSatelliteSpeed(Number(e.target.value))}
            className="w-full"
          />
        </div>

        {/* The collision alert */}
        {collision && (
          
          <div className="absolute top-4 right-4 bg-slate-500/80 text-white p-4 rounded-lg shadow-lg backdrop-blur-sm">
            <h3 className="font-bold text-lg">⚠️ Collision Alert!</h3>
            <p className="text-sm">
              {collision.sat1} and {collision.sat2} are too close!
            </p>
            <p className="text-xs mt-1">
              Distance: {collision.distance.toFixed(2)} units               {/*toFixed makes sure we only get two decimal places value*/}
            </p>
          </div>
        )}  
<div className="absolute top-1/4 left-4 z-10">
  <h3 className="text-white p-1 text-2xl underline font-bold">Currently Available Satellites</h3>
  <h4 className="text-white p-1 font-bold ">Click on each to see their path and behavior</h4>

  <ul>
  {allSatellites.map(sat => {
    const isActive = activeSatellites.some(active => active.name === sat.name);         //check each element from allSatellites if it exists in activeSatellites also if yes then set isActive to true 

    return (
      <li key={sat.name}>
       <button
    onClick={() => handleSatellite(sat)}
    className="cursor-pointer p-1 hover:bg-slate-500"
    style={{ color: isActive ? sat.originalColor.getStyle() : "white" }}
  >
    {sat.name}
  </button>

      </li>
    );
  })}
</ul>
</div>
      </div>
    </div>
  );
}






        
    
   