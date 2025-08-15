'use client';

import { useEffect,useRef } from "react";
import * as THREE from 'three';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
  
//useRef is complete opposit of useState, changing whats inside the useRef doesnt cause the component to re render
//it is also used to make the webpage remember cetain variables during re renders lets say a timer which would get reset every time a re render occurs 
//so we use useRef to keep that timer and it doesnt change or reset on every re render

export default function HomePage() {
  // This ref will hold our canvas element
  const mountRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // This code will run only once, after the component has mounted
    if (!mountRef.current) return;

    const currentMount = mountRef.current;

     // --- 1. The Scene Setup (The "Stage") 
        const scene = new THREE.Scene();                                                                                 //defining a new stage
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);               // position of the camera i.e from where the user would see the earth
        const renderer = new THREE.WebGLRenderer({ antialias: true });                                                   //this is the projector it takes what the camera sees and draws it onto the screen
        renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(renderer.domElement);





        // --- 2. The Earth (main actor) 
        const earthGeometry = new THREE.SphereGeometry(1, 32, 32); // A sphere with radius 1
        
        const earthTexture = new THREE.TextureLoader().load(
    'https://threejs.org/examples/textures/land_ocean_ice_cloud_2048.jpg'
  );
  const earthMaterial = new THREE.MeshStandardMaterial({ map: earthTexture });                                                                                                     // A simple blue material we change it to the real earth texture here


        const earth = new THREE.Mesh(earthGeometry, earthMaterial);                                                     //combining the shape and the color 
        scene.add(earth);                                                                                               // adding our actor to the stage

        //we did not give any coordinates to our main actor(earth) so it is by default placed at (0,0,0) i.e the center of our stage








        //similarly making more actors(smaller satellites and adding them to our scene)
        // --- 3. The Satellites (more ators) 
        const satelliteGeometry = new THREE.SphereGeometry(0.05, 8, 8); // A smaller sphere
        const satelliteMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff }); // A white material
        const satellite1 = new THREE.Mesh(satelliteGeometry, satelliteMaterial);
        const satellite2 = new THREE.Mesh(satelliteGeometry, satelliteMaterial.clone()); // A second satellite
        scene.add(satellite1);
        scene.add(satellite2);

       



          // --- Lighting
        // We need light to see the MeshStandardMaterial
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // Soft, general light
        scene.add(ambientLight);
        const pointLight = new THREE.PointLight(0xffffff, 1); // A bright light from a single point
        pointLight.position.set(5, 3, 5); // Position the light
        scene.add(pointLight);




       








        // // --- The Cursor Controls  ---
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true; 
        controls.target.set(0, 0, 0); // Always look at Earth center
        camera.position.set(0, 0, 5); // Move back from Earth
        controls.update();      //setting the camera position after defining controls because defining controls resets the camera to (0,0,0) which would take the camera inside the earth

 


       





        // --- 4. The Animation (The "Action!") ---
        function animate() {
            requestAnimationFrame(animate);                         // This creates a loop

            // Rotating the Earth
            earth.rotation.y += 0.001;

            // Making the satellites orbit
            const time = Date.now() * 0.0005;                       //Date.now() gives the seconds that has passed since 1970 which is very large number so we multiply it by small number to make our satellite move slowly
            satellite1.position.x = Math.cos(time) * 2;             //produces a circular orbit as the time increases
            satellite1.position.z = Math.sin(time) * 2;             //we are using cos for x axis and sin for z axis which plots a circle along x-z axis(path of satellit 1)

            //when we do Math.cos(time)*2 it creates a circular path that is centered around the center i.e (0,0,0)
            //Math.cos(angle) gives us the x coordinate of the unit circle and Math.sin(angle) gives us the y coordinate of the unit circle
            //as time changes the angle increases and the point moves forward wrt to the angle 
            //Math.cos(time) gives us the position on a circle with radius 1 so if we multiply the result by 2 or 2.5 it gives us the position of the point on the circle of radius 2 or 2.5 respectively


            satellite2.position.x = Math.cos(time * 0.7) * 2.5;     //path of satellite 2(circle along (x-y axis)
            
            satellite2.position.y = Math.sin(time * 0.7) * 2.5;     //2.5 is the radius of that circle
            

            controls.update();


            // Rendering the scene from the camera's perspective
            renderer.render(scene, camera);
        }

        // Start the animation
        animate();

       // Handle window resize
    const handleResize = () => {
      renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
      camera.aspect = currentMount.clientWidth / currentMount.clientHeight;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', handleResize);

    // This is a cleanup function that runs when the component is unmounted
    return () => {
        window.removeEventListener('resize', handleResize);
        currentMount.removeChild(renderer.domElement);
    };
  }, []); // The empty array ensures this runs only once

  // The ref is attached to this div, which is where our 3D scene will be rendered
  return <div ref={mountRef} className="w-full h-screen" />;
}  