import {useMemo,useRef} from 'react';
import {useFrame,useThree} from '@react-three/fiber';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import {useTexture} from '@react-three/drei';
import * as THREE from 'three';

// The diner's dishes, modelled after the real thing: a coconut chicken hotpot, coconut milk jelly in a coconut
// // shell, shrimp dumplings in a bamboo steamer, and a cup of bubble tea.
// Sizes are in island units (a dinner plate is about .5 across); each dish sits on y = 0.

let seed=7;const rnd=()=>{seed=(seed*16807)%2147483647;return (seed-1)/2147483646;};
function lathe(profile:[number,number][],segments=40){return new THREE.LatheGeometry(profile.map(([r,h])=>new THREE.Vector2(r,h)),segments);}
/** A soft studio reflection used only by the dishes: steel, glaze, broth and glass need something to reflect. */
let dishEnv:THREE.Texture|null=null;
function useDishEnv(){const {gl}=useThree();return useMemo(()=>{if(!dishEnv){const pm=new THREE.PMREMGenerator(gl);dishEnv=pm.fromScene(new RoomEnvironment(),.04).texture;pm.dispose();}return dishEnv;},[gl]);}
/** An irregular rounded chunk (chicken, coconut meat), from a jittered sphere. */
function chunk(radius:number,stretch:[number,number,number],jitter=.18){const g=new THREE.SphereGeometry(radius,16,12);const p=g.attributes.position as THREE.BufferAttribute;
 for(let i=0;i<p.count;i++){const v=new THREE.Vector3().fromBufferAttribute(p,i);const k=1+(Math.sin(v.x*31+v.y*17)*.5+Math.sin(v.z*23-v.x*11)*.5)*jitter;v.multiplyScalar(k);v.set(v.x*stretch[0],v.y*stretch[1],v.z*stretch[2]);p.setXYZ(i,v.x,v.y,v.z);}
 g.computeVertexNormals();return g;}
const china=<meshPhysicalMaterial color="#fbf8f1" roughness={.18} clearcoat={.7} clearcoatRoughness={.25}/>;

function Steam({count=5,height=.5,width=.12,position=[0,0,0] as [number,number,number]}){
 const texture=useTexture('/textures/cloud.png');const group=useRef<THREE.Group>(null);
 useFrame(()=>{const g=group.current;if(!g)return;const t=performance.now()/1000;g.children.forEach((c,i)=>{const k=(t*.28+i/count)%1;c.position.set(Math.sin(k*5+i)*width*.4,k*height,Math.cos(k*4+i)*width*.3);c.scale.setScalar(width*(.5+k*1.4));((c as THREE.Sprite).material as THREE.SpriteMaterial).opacity=Math.sin(k*Math.PI)*.32;});});
 return <group ref={group} position={position}>{Array.from({length:count},(_,i)=><sprite key={i}><spriteMaterial map={texture} color="#ffffff" transparent depthWrite={false} opacity={0}/></sprite>)}</group>;
}

/** 虾饺：四只透明虾饺，放在竹蒸笼中。 */
export function HarGow(){
 const body=useMemo(()=>lathe([
  [0,0],[.04,0],[.052,.025],[.055,.06],
  [.048,.09],[.035,.112],[.03,.12]
 ],36),[]);

 const shrimp=useMemo(()=>chunk(.025,[1.5,.45,.7],.12),[]);

 const slats=useMemo(()=>{
  const c=document.createElement('canvas');
  c.width=128;
  c.height=32;

  const g=c.getContext('2d')!;
  for(let x=0;x<128;x+=8){
   g.fillStyle=x%16?'#d8b67a':'#caa465';
   g.fillRect(x,0,8,32);
  }

  g.fillStyle='#b48d50';
  g.fillRect(0,0,128,3);
  g.fillRect(0,29,128,3);

  const t=new THREE.CanvasTexture(c);
  t.colorSpace=THREE.SRGBColorSpace;
  t.wrapS=THREE.RepeatWrapping;
  t.repeat.set(6,1);
  return t;
 },[]);

 return <group>
  <mesh position={[0,.045,0]} castShadow>
   <cylinderGeometry args={[.21,.21,.09,40,1,true]}/>
   <meshStandardMaterial
    map={slats}
    roughness={.8}
    side={THREE.DoubleSide}
   />
  </mesh>

  <mesh position={[0,.012,0]}>
   <cylinderGeometry args={[.205,.205,.012,40]}/>
   <meshStandardMaterial color="#cfac6f" roughness={.85}/>
  </mesh>

  <mesh position={[0,.02,0]} rotation={[-Math.PI/2,0,0]}>
   <circleGeometry args={[.19,40]}/>
   <meshStandardMaterial color="#f3ead6" roughness={.9}/>
  </mesh>

  {[[-.07,-.06],[.07,-.06],[-.07,.07],[.07,.07]].map(([x,z],i)=>
   <group
    key={i}
    position={[x,.02,z]}
    rotation={[0,i*.7,0]}
   >
    <mesh geometry={body} castShadow>
     <meshPhysicalMaterial
      color="#fff4df"
      transparent
      opacity={.82}
      roughness={.3}
      clearcoat={.5}
      side={THREE.DoubleSide}
     />
    </mesh>

    <mesh
     geometry={shrimp}
     position={[0,.065,0]}
     rotation={[0,i*.8,0]}
     scale={[1.2,1,1]}
    >
     <meshPhysicalMaterial
      color="#e97955"
      roughness={.35}
      clearcoat={.4}
     />
    </mesh>

    {[0,1,2,3].map(k=>
     <mesh
      key={k}
      position={[
       Math.cos(k*1.57)*.032,
       .105,
       Math.sin(k*1.57)*.032
      ]}
      rotation={[0,0,k*.5]}
     >
      <torusGeometry args={[.025,.0025,6,16,Math.PI]}/>
      <meshStandardMaterial color="#fffaf0"/>
     </mesh>
    )}
   </group>
  )}

  <Steam
   position={[0,.16,0]}
   height={.4}
   width={.11}
   count={4}
  />
 </group>;
}


/** 煲仔饭：砂锅米饭、腊肠、青菜和煎蛋。 */
export function ClaypotRice(){
 const pot=useMemo(()=>lathe([
  [0,0],[.16,0],[.2,.025],[.22,.08],
  [.21,.13],[.18,.15],[0,.15]
 ]),[]);

 const rice=useMemo(()=>{
  seed=41;
  return Array.from({length:22},()=>{
   const a=rnd()*Math.PI*2;
   const r=rnd()*.14;
   return [
    Math.cos(a)*r,
    .17+rnd()*.012,
    Math.sin(a)*r
   ] as [number,number,number];
  });
 },[]);

 return <group>
  <mesh geometry={pot} position={[0,.02,0]} castShadow>
   <meshStandardMaterial
    color="#b96f3c"
    roughness={.7}
    side={THREE.DoubleSide}
   />
  </mesh>

  <mesh position={[0,.155,0]} rotation={[-Math.PI/2,0,0]}>
   <circleGeometry args={[.18,40]}/>
   <meshStandardMaterial color="#f5eee0" roughness={.8}/>
  </mesh>

  {/* 米饭 */}
  {rice.map((p,i)=>
   <mesh
    key={i}
    position={p}
    scale={[.018,.012,.018]}
   >
    <sphereGeometry args={[1,8,6]}/>
    <meshStandardMaterial color="#fff8e8" roughness={.8}/>
   </mesh>
  )}

  {/* 腊肠 */}
  {[0,1,2,3].map(i=>
   <mesh
    key={i}
    position={[-.07+i*.045,.19,.045]}
    rotation={[0,0,Math.PI/2]}
   >
    <cylinderGeometry args={[.014,.014,.08,12]}/>
    <meshStandardMaterial color="#a83d2c" roughness={.45}/>
   </mesh>
  )}

  {/* 青菜 */}
  {[0,1,2].map(i=>
   <mesh
    key={i}
    position={[.08,.18,-.06+i*.035]}
    scale={[.035,.008,.018]}
   >
    <sphereGeometry args={[1,8,6]}/>
    <meshStandardMaterial color="#5f9b45" roughness={.7}/>
   </mesh>
  )}

  {/* 煎蛋 */}
  <mesh
   position={[.02,.185,-.045]}
   rotation={[-Math.PI/2,0,0]}
  >
   <circleGeometry args={[.045,20]}/>
   <meshStandardMaterial color="#fff6d5" roughness={.5}/>
  </mesh>

  <mesh position={[.02,.19,-.045]}>
   <sphereGeometry args={[.018,12,8]}/>
   <meshStandardMaterial color="#f2a51b" roughness={.35}/>
  </mesh>

  <Steam
   position={[0,.17,0]}
   height={.5}
   width={.13}
   count={5}
  />
 </group>;
}


/** 肠粉：白色米浆卷、酱油和葱花。 */
export function CheungFun(){
 return <group>
  <mesh position={[0,.025,0]}>
   <cylinderGeometry args={[.19,.19,.012,32]}/>
   {china}
  </mesh>

  {[0,1,2].map(i=>
   <group
    key={i}
    position={[-.07+i*.07,.055,0]}
    rotation={[0,0,Math.PI/2]}
   >
    <mesh>
     <cylinderGeometry args={[.025,.025,.14,20]}/>
     <meshPhysicalMaterial
      color="#fffdf5"
      roughness={.25}
      clearcoat={.5}
     />
    </mesh>

    <mesh
     position={[0,.071,0]}
     rotation={[0,0,Math.PI/2]}
    >
     <circleGeometry args={[.023,20]}/>
     <meshStandardMaterial
      color="#f8f1df"
      roughness={.5}
     />
    </mesh>
   </group>
  )}

  {/* 酱油 */}
  <mesh
   position={[0,.084,.01]}
   rotation={[-Math.PI/2,0,0]}
  >
   <circleGeometry args={[.12,32]}/>
   <meshStandardMaterial
    color="#6d351f"
    roughness={.3}
   />
  </mesh>

  {/* 葱花 */}
  {[0,1,2,3,4,5,6,7].map(i=>
   <mesh
    key={i}
    position={[
     Math.cos(i*.8)*.09,
     .09,
     Math.sin(i*.8)*.05
    ]}
    scale={[.012,.003,.004]}
   >
    <sphereGeometry args={[1,6,4]}/>
    <meshStandardMaterial color="#5b9940"/>
   </mesh>
  )}
 </group>;
}


/** 珍珠奶茶：透明杯、奶茶、珍珠和吸管。 */
export function BubbleTea(){
 const glass=useMemo(()=>lathe([
  [0,0],
  [.062,0],
  [.07,.008],
  [.075,.22],
  [.07,.225],
  [.064,.008],
  [0,.008]
 ],32),[]);

 const pearls=useMemo(()=>{
  seed=53;

  return Array.from({length:18},()=>{
   const a=rnd()*Math.PI*2;
   const r=rnd()*.045;

   return [
    Math.cos(a)*r,
    .035+rnd()*.025,
    Math.sin(a)*r
   ] as [number,number,number];
  });
 },[]);

 return <group>
  {/* 杯底 */}
  <mesh position={[0,.02,0]}>
   <cylinderGeometry args={[.082,.082,.008,28]}/>
   <meshStandardMaterial
    color="#d7c3a0"
    roughness={.8}
   />
  </mesh>

  {/* 透明杯身 */}
  <mesh geometry={glass} position={[0,.024,0]}>
   <meshPhysicalMaterial
    color="#ffffff"
    roughness={.04}
    transparent
    opacity={.25}
    clearcoat={1}
    side={THREE.DoubleSide}
    depthWrite={false}
   />
  </mesh>

  {/* 奶茶 */}
  <mesh position={[0,.125,0]}>
   <cylinderGeometry args={[.066,.06,.19,32]}/>
   <meshPhysicalMaterial
    color="#c78b58"
    roughness={.35}
    clearcoat={.3}
   />
  </mesh>

  {/* 奶泡 */}
  <mesh
   position={[0,.224,0]}
   rotation={[-Math.PI/2,0,0]}
  >
   <circleGeometry args={[.067,32]}/>
   <meshStandardMaterial
    color="#f1d5ae"
    roughness={.45}
   />
  </mesh>

  {/* 珍珠 */}
  {pearls.map((p,i)=>
   <mesh
    key={i}
    position={p}
    scale={[.012,.012,.012]}
   >
    <sphereGeometry args={[1,12,8]}/>
    <meshStandardMaterial
     color="#3a211b"
     roughness={.3}
     metalness={.05}
    />
   </mesh>
  )}

  {/* 吸管 */}
  <mesh
   position={[.018,.31,0]}
   rotation={[0,0,-.18]}
  >
   <cylinderGeometry args={[.007,.007,.28,12]}/>
   <meshStandardMaterial
    color="#e58a9c"
    roughness={.35}
   />
  </mesh>

  {/* 吸管弯头 */}
  <mesh
   position={[.045,.45,0]}
   rotation={[0,0,Math.PI/2]}
  >
   <torusGeometry args={[.025,.007,8,16,Math.PI/2]}/>
   <meshStandardMaterial
    color="#e58a9c"
    roughness={.35}
   />
  </mesh>
 </group>;
}


/** 菜品统一入口。 */
export function Dish({kind}:{kind:string}){
 const env=useDishEnv();
 const group=useRef<THREE.Group>(null);

 useFrame(()=>{
  const g=group.current;
  if(!g||g.userData.env)return;

  g.traverse(o=>{
   const m=(o as THREE.Mesh).material
    as THREE.MeshStandardMaterial|undefined;

   if(
    m &&
    'envMap' in m &&
    !(m instanceof THREE.SpriteMaterial)
   ){
    m.envMap=env;
    m.envMapIntensity=.55;
    m.needsUpdate=true;
   }
  });

  g.userData.env=true;
 });

 return <group ref={group}>
 {kind==='rice'
  ? <ClaypotRice/>
  : kind==='dumpling'
  ? <HarGow/>
  : kind==='cheungfun'
  ? <CheungFun/>
  : kind==='bubbletea'
  ? <BubbleTea/>
  : null}
</group>;
