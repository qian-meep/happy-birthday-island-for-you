import {useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import {useTexture} from '@react-three/drei';
import * as THREE from 'three';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {useIsland} from '../store';
import {menu} from '../content';
import {chime} from '../lib/audio';

type Vec3=[number,number,number];
type Surface='ceramic'|'matte'|'metal'|'glass';
type Parts=Partial<Record<Surface,THREE.BufferGeometry>>;
const cache=new Map<string,Parts>();
const surfaces:Record<Surface,THREE.MeshStandardMaterial>= {
 ceramic:new THREE.MeshStandardMaterial({vertexColors:true,roughness:.3}),
 matte:new THREE.MeshStandardMaterial({vertexColors:true,roughness:.78}),
 metal:new THREE.MeshStandardMaterial({vertexColors:true,metalness:.35,roughness:.28}),
 glass:new THREE.MeshStandardMaterial({vertexColors:true,roughness:.12,transparent:true,opacity:.25,depthWrite:false}),
};
const lathe=(profile:number[][],segments=32)=>new THREE.LatheGeometry(profile.map(([x,y])=>new THREE.Vector2(x,y)),segments);

/** Bake coloured ingredients into at most four draws per dish. The shared cache
 * survives leaving the diner; no canvas textures, per-ingredient materials or PMREM. */
export function dishGeometry(kind:string):Parts {
 if(cache.has(kind))return cache.get(kind)!;
 const buckets:Record<Surface,THREE.BufferGeometry[]>={ceramic:[],matte:[],metal:[],glass:[]};
 const add=(g:THREE.BufferGeometry,color:string,p:Vec3=[0,0,0],scale:Vec3=[1,1,1],rot:Vec3=[0,0,0],surface:Surface='ceramic')=>{
  g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(...p),new THREE.Quaternion().setFromEuler(new THREE.Euler(...rot)),new THREE.Vector3(...scale)));
  const geom=g.index?g.toNonIndexed():g; if(geom!==g)g.dispose();geom.deleteAttribute('uv');
  const c=new THREE.Color(color),colors=new Float32Array(geom.attributes.position.count*3);
  for(let i=0;i<colors.length;i+=3){colors[i]=c.r;colors[i+1]=c.g;colors[i+2]=c.b;}
  geom.setAttribute('color',new THREE.BufferAttribute(colors,3));buckets[surface].push(geom);
 };
 const sphere=(p:Vec3,size:Vec3,c:string,rot:Vec3=[0,0,0],surface:Surface='ceramic')=>add(new THREE.SphereGeometry(1,12,8),c,p,size,rot,surface);
 const box=(p:Vec3,size:Vec3,c:string,rot:Vec3=[0,0,0],surface:Surface='matte')=>add(new THREE.BoxGeometry(...size),c,p,[1,1,1],rot,surface);
 const ring=(r:number,y:number,c:string,t=.005,surface:Surface='ceramic')=>add(new THREE.TorusGeometry(r,t,5,32),c,[0,y,0],[1,1,1],[Math.PI/2,0,0],surface);
 const plate=(r:number)=>{add(lathe([[0,0],[r*.72,0],[r,.025],[r,.035],[r*.75,.012],[0,.012]]),'#f5edda');ring(r-.012,.032,'#76968a',.003);};
 if(kind==='rice'){
  // 煲仔饭砂锅
  add(
   lathe([
    [0,0],
    [.16,0],
    [.2,.025],
    [.22,.08],
    [.21,.13],
    [.18,.15],
    [0,.15]
   ]),
   '#b96f3c',
   [0,.02,0],
   [1,1,1],
   [0,0,0],
   'matte'
  );
  // 米饭
  for(let i=0;i<24;i++){
   const a=i*2.399;
   const r=(i%5)*.025;
   sphere(
    [Math.cos(a)*r,.17+(i%3)*.006,Math.sin(a)*r],
    [.018,.012,.018],
    '#fff8e8'
   );
  }
  // 腊肠
  for(let i=0;i<4;i++){
   add(
    new THREE.CylinderGeometry(.014,.014,.08,12),
    '#a83d2c',
    [-.07+i*.045,.2,.045],
    [1,1,1],
    [0,0,Math.PI/2],
    'matte'
   );
  }
  // 青菜
  for(let i=0;i<3;i++){
   sphere(
    [.08,.185,-.06+i*.035],
    [.035,.008,.018],
    '#5f9b45',
    [0,0,0],
    'matte'
   );
  }
  // 煎蛋
  add(
   new THREE.CylinderGeometry(.045,.045,.006,20),
   '#fff6d5',
   [.02,.19,-.045],
   [1,1,1],
   [0,0,0],
   'ceramic'
  );
  sphere(
   [.02,.197,-.045],
   [.018,.012,.018],
   '#f2a51b',
   [0,0,0],
   'matte'
  );
 } else if(kind==='cheungfun'){
  // 肠粉餐盘
  plate(.2);
  // 三卷肠粉
  for(let i=0;i<3;i++){
   add(
    new THREE.CylinderGeometry(.025,.025,.14,20),
    '#fffdf5',
    [-.07+i*.07,.065,0],
    [1,1,1],
    [0,0,Math.PI/2],
    'ceramic'
   );
  }
  // 酱油
  add(
   new THREE.CylinderGeometry(.12,.12,.004,24),
   '#6d351f',
   [0,.093,.01],
   [1,1,1],
   [0,0,0],
   'matte'
  );
  // 葱花
  for(let i=0;i<8;i++){
   const a=i*.8;
   box(
    [Math.cos(a)*.09,.098,Math.sin(a)*.05],
    [.012,.003,.004],
    '#5b9940',
    [0,a,0],
    'matte'
   );
  } else if(kind==='dumpling'){
  add(lathe([[0,0],[.22,0],[.22,.08],[.211,.09],[.204,.08],[.204,.014],[0,.014]]),'#c8a26b',[0,.02,0],[1,1,1],[0,0,0],'matte');
  add(new THREE.CylinderGeometry(.203,.203,.006,32),'#f2e7cd',[0,.04,0]);
  ring(.215,.032,'#ab8553',.006,'matte');ring(.215,.104,'#e2c18c',.007,'matte');
  for(let i=0;i<24;i++){const a=i*Math.PI/12;box([Math.sin(a)*.218,.07,Math.cos(a)*.218],[.002,.048,.003],'#b38b56',[0,a,0]);}
  for(let i=0;i<4;i++){
   const x=i%2?.075:-.075,z=i<2?-.07:.075;
   const wrapper=lathe([[0,0],[.043,0],[.054,.035],[.05,.068],[.035,.092],[.047,.112],[.06,.119]],32);
   const p=wrapper.attributes.position as THREE.BufferAttribute;
   for(let k=0;k<p.count;k++){const a=Math.atan2(p.getZ(k),p.getX(k)),y=p.getY(k),f=1+Math.sin(a*12)*(.025+y*.85);p.setXYZ(k,p.getX(k)*f,y+Math.sin(a*12)*.003*(y/.12),p.getZ(k)*f);}wrapper.computeVertexNormals();
   add(wrapper,'#efe1bc',[x,.044,z]);
   add(new THREE.CylinderGeometry(.036,.036,.005,16),'#9f7542',[x,.15,z]);
   for(let j=0;j<9;j++){const a=j*2.4,r=j%3*.012;sphere([x+Math.cos(a)*r,.157,z+Math.sin(a)*r],[.006,.0035,.009],j%2?'#c39758':'#b3844b',[0,a,0]);}
   add(new THREE.IcosahedronGeometry(.023,1),'#eca13d',[x,.174,z],[1,.65,1]);
   for(let j=0;j<3;j++)add(new THREE.IcosahedronGeometry(.006,0),'#f3b751',[x+Math.cos(j*2.1)*.02,.163,z+Math.sin(j*2.1)*.02]);
  }
 } else if(kind==='bubbletea'){
  // 透明杯底
  add(
   new THREE.CylinderGeometry(.085,.085,.009,24),
   '#c5a479',
   [0,.012,0],
   [1,1,1],
   [0,0,0],
   'matte'
  );
  // 透明杯身
  add(
   lathe([
    [0,0],
    [.055,0],
    [.061,.007],
    [.071,.22],
    [.064,.225],
    [.054,.012],
    [0,.012]
   ]),
   '#e9f3e8',
   [0,.02,0],
   [1,1,1],
   [0,0,0],
   'glass'
  );
  // 奶茶
  add(
   new THREE.CylinderGeometry(.064,.058,.19,24),
   '#bd8050',
   [0,.12,0],
   [1,1,1],
   [0,0,0],
   'matte'
  );
  // 奶泡
  add(
   new THREE.CylinderGeometry(.063,.063,.012,24),
   '#efd2a9',
   [0,.218,0]
  );
  // 珍珠
  for(let i=0;i<18;i++){
   const a=i*2.399;
   const r=.012+(i%4)*.011;
   sphere(
    [Math.cos(a)*r,.038+(i%3)*.012,Math.sin(a)*r],
    [.012,.012,.012],
    '#3a211b',
    [0,0,0],
    'matte'
   );
  }
  // 吸管
  box(
   [.025,.34,0],
   [.008,.27,.008],
   '#d78298',
   [0,0,-.16],
   'matte'
  );
  box(
   [.048,.47,0],
   [.06,.008,.008],
   '#d78298',
   [0,0,0],
   'matte'
  );
 const baked:Parts={};for(const surface of Object.keys(buckets) as Surface[]){const parts=buckets[surface];if(parts.length){baked[surface]=mergeGeometries(parts,false)!;parts.forEach(g=>g.dispose());}}
 cache.set(kind,baked);return baked;
}

function Steam(){
 const texture=useTexture('/textures/cloud.png'),ref=useRef<THREE.Group>(null);
 useFrame(()=>{if(!ref.current||document.hidden)return;const t=performance.now()/1000;ref.current.children.forEach((o,i)=>{const k=(t*.36+i/3)%1;o.position.set(Math.sin(k*4+i)*.035,k*.34,Math.cos(k*3+i)*.025);o.scale.setScalar(.07+k*.12);((o as THREE.Sprite).material as THREE.SpriteMaterial).opacity=Math.sin(k*Math.PI)*.23;});});
 return <group ref={ref} position={[0,.19,0]}>{[0,1,2].map(i=><sprite key={i}><spriteMaterial map={texture} color="#fff5df" transparent opacity={0} depthWrite={false}/></sprite>)}</group>;
}
export default function Dish({kind,position}:{kind:string;position:Vec3}){
 const parts=dishGeometry(kind),group=useRef<THREE.Group>(null),tapAt=useRef(-Infinity),reduced=useIsland(s=>s.save.settings.reducedMotion);
 useFrame(()=>{if(!group.current)return;const t=(performance.now()-tapAt.current)/1000;if(t>1){group.current.scale.set(1,1,1);return;}const k=Math.sin(t*18)*Math.exp(-t*5)*.07;group.current.scale.set(1+k,1-k,1+k);});
 return <group position={position} ref={group} onClick={e=>{if(e.delta>8)return;e.stopPropagation();const dish=menu.find(m=>m.kind===kind);if(!dish)return;if(!reduced)tapAt.current=performance.now();chime();useIsland.getState().notify(dish.note);}}>
  {(Object.keys(parts) as Surface[]).map(surface=><mesh key={surface} geometry={parts[surface]} material={surfaces[surface]} dispose={null}/>)}
  {!reduced&&(kind==='rice'||kind==='dumpling'||kind==='cheungfun')&&<Steam/>}
 </group>;
}
