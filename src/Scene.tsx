import React, { useRef, Suspense, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  OrbitControls,
  Environment,
  PerspectiveCamera,
  useGLTF,
  Html,
  TransformControls,
} from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { Leva, useControls } from "leva";
import * as THREE from "three";

type TransformMode = "translate" | "scale" | "rotate";

// Компонент осей
const Axes = () => {
  const { scene } = useThree();
  const ref = useRef<THREE.AxesHelper>(null!);
  React.useEffect(() => {
    if (ref.current) scene.add(ref.current);
    return () => {
      if (ref.current) scene.remove(ref.current);
    };
  }, [scene]);
  return <primitive ref={ref} object={new THREE.AxesHelper(3)} />;
};

// Компонент вращающегося куба с контролем цвета и масштаба
interface RotatingCubeProps {
  color: string;
  scale: number;
  position: [number, number, number];
  onClick: () => void;
}
const RotatingCube = React.forwardRef<THREE.Mesh, RotatingCubeProps>(
  ({ color, scale, position, onClick }, ref) => {
    useFrame(() => {
      if (ref && typeof ref !== "function" && ref.current) {
        ref.current.rotation.x += 0.01;
        ref.current.rotation.y += 0.01;
      }
    });
    return (
      <mesh
        ref={ref}
        castShadow
        receiveShadow
        scale={scale}
        position={position}
        onClick={onClick}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={color} roughness={0.2} metalness={0.8} />
      </mesh>
    );
  }
);

// Мощная 3D-модель (hero.glb)
interface ModelProps {
  scale: number;
  position: [number, number, number];
  onClick: () => void;
}
const HeroModel = React.forwardRef<THREE.Object3D, ModelProps>(
  ({ scale, position, onClick }, ref) => {
    const { scene } = useGLTF("/models/hero.glb", true);
    return (
      <primitive
        ref={ref}
        object={scene}
        scale={scale}
        position={position}
        onClick={onClick}
      />
    );
  }
);

// Вторая модель Minecraft Trump
const MinecraftTrump = React.forwardRef<THREE.Object3D, ModelProps>(
  ({ scale, position, onClick }, ref) => {
    const { scene } = useGLTF(
      "/models/minecraft_donald_trump_build_schematic.glb",
      true
    );
    return (
      <primitive
        ref={ref}
        object={scene}
        scale={scale}
        position={position}
        onClick={onClick}
      />
    );
  }
);

const Scene: React.FC = () => {
  // Состояния для выделения и управления объектами
  const [selected, setSelected] = useState<string | null>(null);
  const [mode, setMode] = useState<TransformMode>("translate");
  const [isTransforming, setIsTransforming] = useState(false);
  const heroRef = useRef<THREE.Object3D>(null);
  const trumpRef = useRef<THREE.Object3D>(null);
  const cubeRef = useRef<THREE.Mesh>(null);

  // Панель управления Leva
  const {
    /* transformMode, */
    heroScale,
    heroX,
    heroY,
    heroZ,
    trumpScale,
    trumpX,
    trumpY,
    trumpZ,
    cubeColor,
    cubeScale,
    cubeX,
    cubeY,
    cubeZ,
    bloomIntensity,
    gridSize,
    gridDivisions,
    axesVisible,
    backgroundColor,
  } = useControls({
    heroScale: { value: 2, min: 0.1, max: 5, step: 0.1, label: "Hero Масштаб" },
    heroX: { value: 2, min: -10, max: 10, step: 0.1 },
    heroY: { value: 0, min: -10, max: 10, step: 0.1 },
    heroZ: { value: 0, min: -10, max: 10, step: 0.1 },
    trumpScale: {
      value: 0.2,
      min: 0.05,
      max: 2,
      step: 0.01,
      label: "Trump Масштаб",
    },
    trumpX: { value: -4, min: -10, max: 10, step: 0.1 },
    trumpY: { value: 0, min: -10, max: 10, step: 0.1 },
    trumpZ: { value: 0, min: -10, max: 10, step: 0.1 },
    cubeColor: { value: "#ff69b4", label: "Куб Цвет" },
    cubeScale: { value: 1, min: 0.1, max: 5, step: 0.1, label: "Куб Масштаб" },
    cubeX: { value: -2, min: -10, max: 10, step: 0.1 },
    cubeY: { value: 0, min: -10, max: 10, step: 0.1 },
    cubeZ: { value: 0, min: -10, max: 10, step: 0.1 },
    bloomIntensity: { value: 2, min: 0, max: 10, step: 0.1, label: "Bloom" },
    gridSize: { value: 20, min: 1, max: 100, step: 1, label: "Grid Size" },
    gridDivisions: {
      value: 20,
      min: 1,
      max: 100,
      step: 1,
      label: "Grid Divisions",
    },
    axesVisible: { value: true, label: "Показать оси" },
    backgroundColor: { value: "#222233", label: "Фон" },
  });

  // Горячие клавиши для смены режима
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;
      if (e.key === "g" || e.key === "G") setMode("translate");
      if (e.key === "s" || e.key === "S") setMode("scale");
      if (e.key === "r" || e.key === "R") setMode("rotate");
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <Leva collapsed={false} />
      <Canvas
        shadows
        style={{ width: "100vw", height: "100vh" }}
        gl={{ preserveDrawingBuffer: true }}
        camera={{ position: [0, 2, 10], fov: 60 }}
        onCreated={({ scene }) => {
          scene.background = new THREE.Color(backgroundColor);
        }}
      >
        <Suspense fallback={<Html center>Загрузка...</Html>}>
          <PerspectiveCamera makeDefault position={[0, 2, 10]} fov={60} />
          <OrbitControls enableZoom enablePan enabled={!isTransforming} />

          {/* Динамическое освещение */}
          <ambientLight intensity={0.4} />
          <spotLight
            position={[10, 20, 10]}
            angle={0.3}
            penumbra={1}
            intensity={2}
            castShadow
          />
          <pointLight position={[-10, -10, -10]} intensity={1} />

          {/* Контроллеры для Hero */}
          <TransformControls
            object={heroRef.current ?? undefined}
            mode={selected === "hero" ? mode : undefined}
            enabled={selected === "hero"}
            showX={true}
            showY={true}
            showZ={true}
            onMouseDown={() => setIsTransforming(true)}
            onMouseUp={() => setIsTransforming(false)}
          />
          {/* Контроллеры для Trump */}
          <TransformControls
            object={trumpRef.current ?? undefined}
            mode={selected === "trump" ? mode : undefined}
            enabled={selected === "trump"}
            showX={true}
            showY={true}
            showZ={true}
            onMouseDown={() => setIsTransforming(true)}
            onMouseUp={() => setIsTransforming(false)}
          />
          {/* Контроллеры для Cube */}
          <TransformControls
            object={cubeRef.current ?? undefined}
            mode={selected === "cube" ? mode : undefined}
            enabled={selected === "cube"}
            showX={true}
            showY={true}
            showZ={true}
            onMouseDown={() => setIsTransforming(true)}
            onMouseUp={() => setIsTransforming(false)}
          />

          {/* Мощная 3D-модель */}
          <HeroModel
            ref={heroRef}
            scale={heroScale}
            position={[heroX, heroY, heroZ]}
            onClick={() => setSelected("hero")}
          />
          {/* Вторая модель Minecraft Trump */}
          <MinecraftTrump
            ref={trumpRef}
            scale={trumpScale}
            position={[trumpX, trumpY, trumpZ]}
            onClick={() => setSelected("trump")}
          />
          {/* Вращающийся куб для динамики */}
          <RotatingCube
            ref={cubeRef}
            color={cubeColor}
            scale={cubeScale}
            position={[cubeX, cubeY, cubeZ]}
            onClick={() => setSelected("cube")}
          />

          {/* HDRI-окружение */}
          <Environment preset="sunset" />

          {/* Сетка для глубины */}
          <gridHelper args={[gridSize, gridDivisions, "#101010", "#505050"]} />
          {/* Оси */}
          {axesVisible && <Axes />}

          {/* Эффекты постобработки */}
          <EffectComposer>
            <Bloom intensity={bloomIntensity} luminanceThreshold={0.2} />
          </EffectComposer>
        </Suspense>
      </Canvas>
    </>
  );
};

export default Scene;

// Для загрузки модели скачай hero.glb (например, с https://sketchfab.com) и помести в public/models/hero.glb
