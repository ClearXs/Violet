'use client';

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';
import { useEffect, useRef } from 'react';

function App() {
  const sceneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // renderer
    const renderer = new THREE.WebGLRenderer({ alpha: true });
    // 添加这行设置渲染器尺寸
    renderer.setSize(
      sceneRef.current?.clientWidth,
      sceneRef.current?.clientHeight
    );
    renderer.setPixelRatio(window.devicePixelRatio);
    sceneRef.current?.appendChild(renderer.domElement);

    // camera
    const camera = new THREE.PerspectiveCamera(
      20.0,
      600 / 400, // 匹配渲染器的宽高比
      0.1,
      10.0
    );
    camera.position.set(0.0, 2.0, 5.0);

    // camera controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.screenSpacePanning = true;
    controls.target.set(0.0, 1.0, 0.0);
    controls.update();

    // scene
    const scene = new THREE.Scene();

    // light
    const light = new THREE.DirectionalLight(0xffffff, Math.PI);
    light.position.set(1.0, 1.0, 1.0).normalize();
    scene.add(light);

    scene.background = null;

    renderer.setClearColor(0x000000, 0); // 第二个参数是透明度，0 = 完全透明

    // gltf and vrm
    let currentVrm = undefined;
    const loader = new GLTFLoader();
    loader.crossOrigin = 'anonymous';

    loader.register((parser) => {
      return new VRMLoaderPlugin(parser);
    });

    loader.load(
      // URL of the VRM you want to load
      '/models/example.vrm',

      // called when the resource is loaded
      (gltf) => {
        const vrm = gltf.userData.vrm;

        // const scene = vrm.scene

        // scene.scale.set(1,1,1)
        // calling these functions greatly improves the performance
        VRMUtils.removeUnnecessaryVertices(gltf.scene);
        VRMUtils.combineSkeletons(gltf.scene);
        VRMUtils.combineMorphs(vrm);

        // Disable frustum culling
        scene.traverse((obj) => {
          obj.frustumCulled = false;
        });

        const faceToFront = THREE.MathUtils.degToRad(180);
        scene.rotation.y = faceToFront;

        currentVrm = vrm;
        console.log(vrm);
        scene.add(vrm.scene);
      },

      // called while loading is progressing
      (progress) =>
        console.log(
          'Loading model...',
          100.0 * (progress.loaded / progress.total),
          '%'
        ),

      // called when loading has errors
      (error) => console.error(error)
    );

    // animate
    const clock = new THREE.Clock();
    clock.start();

    function animate() {
      requestAnimationFrame(animate);

      // update vrm components

      const deltaTime = clock.getDelta();
      if (currentVrm) {
        // tweak expressions
        const s = Math.sin(Math.PI * clock.elapsedTime);
        currentVrm.expressionManager.setValue('aa', 0.5 + 0.5 * s);
        currentVrm.expressionManager.setValue('blinkLeft', 0.5 - 0.5 * s);

        // update vrm
        currentVrm.update(deltaTime);
      }

      // render
      renderer.render(scene, camera);
    }

    animate();
  }, []);

  return (
    <div
      ref={(ref) => (sceneRef.current = ref)}
      className='w-screen h-screen flex justify-center items-center'
    ></div>
  );
}

export default App;
