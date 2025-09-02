# Orbital Eye: A 3D Satellite Tracker



Orbital Eye is an interactive, real-time 3D visualization of satellites orbiting a realistic model of Earth. Built with Next.js and Three.js, this application fetches real Two-Line Element (TLE) data to accurately calculate and display the paths of various satellites.

**Live Demo:** [https://orbitaleye-alpha.vercel.app/](https://your-deployment-link.vercel.app/) _(You can replace this with your actual Vercel link)_

---

## ✨ Key Features

* **Real-Time Satellite Tracking:** Utilizes the `satellite.js` library to accurately propagate satellite positions from real TLE data.
* **Interactive 3D Globe:** A fully interactive 3D scene built with Three.js, featuring a textured Earth, a moving Sun, and a realistic starfield skybox.
* **Dynamic Satellite Selection:** Users can select from a list of available satellites to dynamically add or remove them from the scene.
* **Visual Orbits:** Each active satellite has its orbital path rendered as a line, making it easy to visualize its trajectory.
* **Collision Detection:** The application monitors the distance between all active satellites and displays a prominent on-screen alert if they come within a predefined threshold.
* **Realistic Day/Night Cycle:** The sun's position and lighting are animated, creating a realistic day/night cycle on the Earth's surface.
* **User Controls:**
    * **Camera:** Full orbital camera controls (zoom, pan, rotate) are enabled via `OrbitControls`.
    * **Simulation Speed:** A slider allows the user to speed up or slow down the simulation time.

---

## 🛠️ Tech Stack

* **Framework:** Next.js (React)
* **Language:** TypeScript
* **3D Rendering:** Three.js
* **Orbital Mechanics:** satellite.js
* **Styling:** Tailwind CSS
* **Deployment:** Vercel

---

## 🚀 Getting Started

To run this project on your local machine, follow these steps:

### 1. Prerequisites

Make sure you have  Node.js and npm installed on your system.

### 2. Clone the Repository

Clone this project to your local machine:
```bash
git clone https://github.com/Arun-s21/orbitaleye
cd orbital-eye


3. Install Dependencies
Install the necessary npm packages. This command will download all the required libraries listed in the package.json file, such as React, Three.js, and Next.js.
```bash
npm install


4. Run the Development Server
Start the Next.js development server. This will launch the application on your local machine with hot-reloading enabled, meaning any changes you save to the code will be reflected instantly in the browser.


5. Open in Browser
Once the server is running, open http://localhost:3000 in your web browser to see the application running.