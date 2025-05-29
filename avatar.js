
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

window.onload = () => loadModel();

function loadModel() {
  const loader = new GLTFLoader();
  loader.load(
    "finalonegirl.glb",
    (gltf) => {
      setupScene(gltf);
      document.getElementById("avatar-loading").style.display = "none";
    },
    (xhr) => {
      const percentCompletion = Math.round((xhr.loaded / xhr.total) * 100);
      document.getElementById(
        "avatar-loading"
      ).innerText = `LOADING... ${percentCompletion}%`;
      console.log(`Loading model... ${percentCompletion}%`);
    },
    (error) => {
      console.log(error);
    }
  );
}

function setupScene(gltf) {
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const container = document.getElementById("avatar-container");
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);

  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  container.appendChild(renderer.domElement);

  // Camera setup
  const camera = new THREE.PerspectiveCamera(
    45,
    container.clientWidth / container.clientHeight
  );
  camera.position.set(0.2, 0.5, 1);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.minDistance = 3;
  controls.minPolarAngle = 1.4;
  controls.maxPolarAngle = 1.4;
  controls.target = new THREE.Vector3(0, 0.75, 0);
  controls.update();

  // Scene setup
  const scene = new THREE.Scene();

  // Lighting setup
  scene.add(new THREE.AmbientLight());

  // add new lighting setup
  const spotlight = new THREE.SpotLight(0xffffff, 20, 8, 1); // color, intensity, max range of light, angle of light
  spotlight.penumbra = 0.5; // size of spotlight
  spotlight.position.set(0, 4, 2);
  spotlight.castShadow = true; // to cast shadows on model
  scene.add(spotlight);

  // add directional light
  const keyLight = new THREE.DirectionalLight(0xffffff, 2); // wl w intensity 2
  // set position
  keyLight.position.set(1, 2, 2);
  // look right at origin
  keyLight.lookAt(new THREE.Vector3());
  scene.add(keyLight);

  // Load avatar
  const avatar = gltf.scene;
  avatar.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
  scene.add(avatar);

  // create pedistal
  const groundGeometry = new THREE.CylinderGeometry(0.6, 0.6, 0.1, 64); // top bottom radius, height, # of sides
  const groundMaterial = new THREE.MeshStandardMaterial(); // standard mesh material for pedistal.
  const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial); // creating new mesh, passing geom and material
  groundMesh.castShadow = false; // dont need mesh to cast shadows
  groundMesh.receiveShadow = true; // mesh receies shadows
  groundMesh.position.y -= 0.05; // below avatar so it looks like model standing on pedistal
  scene.add(groundMesh);

  // Load animations
  const mixer = new THREE.AnimationMixer(avatar); // alows to take multiple animation clips in blender (wave, stumble)

  const clips = gltf.animations; // get animation clips from gltf model
  const waveClip = THREE.AnimationClip.findByName(clips, "waving"); // find the waving clip
  const stumbleClip = THREE.AnimationClip.findByName(clips, "stagger"); // find the stagger clip
  // create actions by calling clipAction on mixer and pass in clip  that we want

  const waveAction = mixer.clipAction(waveClip); // create actions associated w each clip
  const stumbleAction = mixer.clipAction(stumbleClip);

  // now adding interactivity

  // to prevent triggers from stumle
  let isStumbling = false;

  // if mouse over an avatr have to add a raycaster

  const raycaster = new THREE.Raycaster();

  container.addEventListener("mousedown", (ev) => {
    // computing normalized device coordinates (taking entire canvas that renderer renders too, map to -1 and 1 in x and -1 to 1 in y axis.  )
    const coords = {
      x: (ev.offsetX / container.clientWidth) * 2 - 1, // taking offset of x and divide by container then multiplie by a scaler to scale
      y: -(ev.offsetY / container.clientHeight) * 2 + 1,
    };

    // to begin
    raycaster.setFromCamera(coords, camera); // pass normalized device componoents -1 and 1 and pass camera to know where to shoot out that ray from
    const intersections = raycaster.intersectObject(avatar); // call intersectObject on raycaster and pass avaar mesh: so asking if there is intersection between mouseclicks and avatar mesh

    /*

    raycatser: determine intersection between objects!
    const raycaster = new THREE.Raycaster();


    .addEvenListner('mousedown', (ev) =>{
      const coords ={
      x:
      y:
      };

      raycatser.setFromCamera(coords, camera)
      const intersections = raycaster.intersectObject(avatar)

      if (intersections.lenghth>0){
      console.log("intersections")}
      
      })
    */

    // check if there is intersection in array
    if (intersections.length > 0) {
      // now if we detect intersection, check if avatr actually stumbling
      if (isStumbling) return; // here we just return bc we dont want to trigger new stumble animation
      // print in console
      /*  console.log("intersection");
       */

      // so if not stumbling then set isStumbling to true
      isStumbling = true;
      stumbleAction.reset(); // reset to begining
      stumbleAction.play(); // playing action
      waveAction.crossFadeTo(stumbleAction, 0.3); // fade from current which is wave to stumble action (from, duration)

      /// however here it just keeps going stagger... we dont want that !
      // so do a setTimeout to delay execution of function

      setTimeout(() => {
        waveAction.reset();
        waveAction.play();
        stumbleAction.crossFadeTo(waveAction, 1);
        // set another timeout
        setTimeout(() => (isStumbling = false), 1000); // set isStumbling to false once the whole wave/ stumble animation 1 sec after. this will ensure all executes before trigger another stumble animation
      }, 4000); // so transitions to wave animation after 4 seconds.!!
    }
  });
  /*

  const mixer = new THREE.AnimationMixer(avatar);
  const clips = gltf.animations
  const waveClip = THREE.AnimationClip.findByName(clips, "waving")
  const staggerClip = THREE.AnimationsClip.findByName(clips, "stagger");
  // actions?
  const waveAction = mixer.clipAction(waveclip);
  const staggerAction = mixer.clipAction(staggerClip);

  */

  // for actions to work properly we need to update mixer each time render new frame
  const clock = new THREE.Clock(); // create new clock

  // create animate function
  function animate() {
    requestAnimationFrame(animate); // request anim frame form browser, pass in ref to animate function as a call back
    mixer.update(clock.getDelta()); // get the chnage in time bw each animation frame, get if from clock, pass to mixer
    renderer.render(scene, camera); // render it to perpective of camera and scene
  }

  animate();
  // final step take one action and call play on it
  waveAction.play();
}
