'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import axios from 'axios';

// Define a type for our satellite data to make the code safer
type Satellite = {
  id: string;
  name: string;
  color: number;
  orbit: {
    radius: number;
    speed: number;
    inclination: number;
  };
};

export default function HomePage() {
  const mountRef = useRef<HTMLDivElement>(null);
  // 1. New state to store our satellite data
  const [satellites, setSatellites] = useState<Satellite[]>([]);

  // 2. This useEffect fetches the data from our API
  useEffect(() => {
    const fetchSatelliteData = async () => {
      try {
        const response = await axios.get('/api/orbits');
        setSatellites(response.data.satellites);
      } catch (error) {
        console.error("Failed to fetch satellite data:", error);
      }
    };
    fetchSatelliteData();
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
    const satelliteObjects: THREE.Mesh[] = [];                                          //array to store satellites from fetched from our backend 
    
    

    satellites.forEach(satData => {                                                     //we are looping through the sattelites object that we received from the backend here
      const satGeometry = new THREE.SphereGeometry(0.05, 8, 8);                         //here we are giving the shape of the satellites i.e 0.5 radius circles
      const satMaterial = new THREE.MeshBasicMaterial({ color: satData.color });        //color that is stored inside satellites.color
      const satellite = new THREE.Mesh(satGeometry, satMaterial);                       //combining the shape and the color
      satelliteObjects.push(satellite);                                                 //adding the satellite to the satellite array here this would be used later for animating the satellites
      scene.add(satellite);                                                             //adding the created satellites to our scene                                 
    });     

    // --- Controls ---
    const controls = new OrbitControls(camera, renderer.domElement);                    //cursor controls
    controls.enableDamping = true;
    camera.position.z = 5;

    // --- Animation loop ---
    const animate = () => {
        requestAnimationFrame(animate);
        earth.rotation.y += 0.001;

        // Animate satellites based on the fetched data
        satelliteObjects.forEach((sat, index) => {
            const satData = satellites[index];
            const time = Date.now() * 0.0001 * satData.orbit.speed;                    //here we are setting the speed of each satellite
            
            sat.position.x = Math.cos(time) * satData.orbit.radius;                    //setting the radius of each satellite's orbit
            sat.position.z = Math.sin(time) * satData.orbit.radius;
            
            // Apply the tilt (inclination)
            // const orbitPlane = new THREE.Object3D();                                  //since each satellite is now in the x-z plane we are setting the inclination here to separate each of their orbits through inlcination on the x-axis
            // orbitPlane.rotation.x = satData.orbit.inclination;                        //get the x-inclination from satellites.orbit.inclination
            // sat.position.applyEuler(orbitPlane.rotation);                             // this statement applies the different orbital tilts
        });



        //Collision detection logic---

        const collisionThreshold = 0.5;                                               //if satellites get closer than this, we'll flag them as red

        satelliteObjects.forEach((sat, index) => {
          (sat.material as THREE.MeshBasicMaterial).color.set(satellites[index].color);     //resetting each satellite to their original color first
        });

        //we are resetting color to original because we want the color of the satellites to be red only for the time they are below distanceThreshold in closeness
        //because the animate function keeps them moving, we keep resetting them to original color and keep on checking their distance by looping through the satelliteObject array
        //if they move further away then we set their color to original and the if condition of the color setting doesnt run and the satellites return to their original color






        //now looping through each satellite and findind distance between them each time the animate functions runs(60 times per second)

        for(let i=0;i<satelliteObjects.length;i++){
          for(let j=i+1;j<satelliteObjects.length;j++){
            const sat1 = satelliteObjects[i];
            const sat2 = satelliteObjects[j];

            // calculate distance
            const distance = sat1.position.distanceTo(sat2.position); 

            if(distance<collisionThreshold){
              (sat1.material as THREE.MeshBasicMaterial).color.set('red');      //setting both their colors red if the distance is less than threshold
              (sat2.material as THREE.MeshBasicMaterial).color.set('red');
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
  }, [satellites]);                                                   //This code only runs when satellite state has some data i.e either a satellite is added or our frontend gets the satellite data that it has fetched from the backend in the previous useEffect

  return <div ref={mountRef} className="w-full h-screen" />;
}