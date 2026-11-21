// Remove non-commercial (CC BY-NC*) source surfaces from shipped model packages.
// The app is sold (paid Windows build, ad-supported web), so NC geometry must not
// be distributed at all; hiding it is not enough. Every other surface keeps its
// original Draco payload, material, node name and order byte-for-byte.
//
// Usage: node scripts/strip_noncommercial_meshes.mjs [--check]
//   --check  only report what would change (exit 1 if NC surfaces remain).
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const models=path.join(root,'dist','models');
const check=process.argv.includes('--check');
// --ids=a,b limits removal to those surfaces (staged cleanup); default is every NC surface.
const only=process.argv.find(a=>a.startsWith('--ids='))?.slice(6).split(',').filter(Boolean);

// Primary license only: Open3D rows read "CC-BY-SA-4.0; UBC-derived muscle texture
// notices CC-BY-NC-SA-4.0" — their geometry is CC BY-SA and handled separately.
export const isNonCommercialLicense=license=>/(^|[^A-Z])NC([^A-Z]|$)/.test(String(license||'').split(';')[0]);

const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const read=file=>JSON.parse(fs.readFileSync(file,'utf8'));
// Keep each file's original trailing-newline convention so byte pins stay stable under autocrlf.
const writeJson=(file,value)=>fs.writeFileSync(file,JSON.stringify(value)+(/\n$/.test(fs.readFileSync(file,'utf8'))?'\n':''));
const clone=value=>structuredClone(value);

function readGlb(file){
  const bytes=fs.readFileSync(file);
  assert.equal(bytes.toString('ascii',0,4),'glTF');assert.equal(bytes.readUInt32LE(4),2);
  const jsonLength=bytes.readUInt32LE(12);assert.equal(bytes.toString('ascii',16,20),'JSON');
  const doc=JSON.parse(bytes.subarray(20,20+jsonLength).toString('utf8'));
  const binaryOffset=20+jsonLength,binLength=bytes.readUInt32LE(binaryOffset);
  assert.equal(bytes.toString('ascii',binaryOffset+4,binaryOffset+8),'BIN\0');
  return{doc,binary:bytes.subarray(binaryOffset+8,binaryOffset+8+binLength)};
}
function encodeGlb(doc,binary){
  const json=Buffer.from(JSON.stringify(doc),'utf8'),jsonPadding=(4-json.length%4)%4;
  const dataPadding=(4-binary.length%4)%4,total=12+8+json.length+jsonPadding+8+binary.length+dataPadding;
  const out=Buffer.alloc(total);out.write('glTF',0,'ascii');out.writeUInt32LE(2,4);out.writeUInt32LE(total,8);
  out.writeUInt32LE(json.length+jsonPadding,12);out.write('JSON',16,'ascii');
  json.copy(out,20);out.fill(0x20,20+json.length,20+json.length+jsonPadding);
  const start=20+json.length+jsonPadding;out.writeUInt32LE(binary.length+dataPadding,start);
  out.write('BIN\0',start+4,'ascii');binary.copy(out,start+8);
  return out;
}

// Rebuild a flat Draco GLB without the removed root nodes. Kept payloads are copied unchanged.
export function withoutNodes(glbFile,removed){
  const {doc,binary}=readGlb(glbFile);
  assert.equal(doc.buffers.length,1);assert.ok(!doc.buffers[0].uri);
  const roots=doc.scenes[doc.scene||0].nodes;
  const gone=doc.nodes.map((n,i)=>removed.has(n.name)?i:-1).filter(i=>i>=0);
  for(const i of gone){assert.ok(roots.includes(i),'removed node must be a scene root');assert.ok(!doc.nodes[i].children?.length);}
  const out={};for(const key of Object.keys(doc))if(!['scene','scenes','nodes','meshes','accessors','bufferViews','buffers','materials'].includes(key))out[key]=clone(doc[key]);
  Object.assign(out,{scene:0,scenes:[{...clone(doc.scenes[doc.scene||0]),nodes:[]}],nodes:[],meshes:[],accessors:[],bufferViews:[],buffers:[{byteLength:0}],materials:[]});
  for(const key of ['images','textures','samplers','skins','animations','cameras'])assert.ok(!doc[key]?.length,'unsupported '+key);
  const chunks=[],materialMap=new Map(),accessorMap=new Map(),viewMap=new Map();let length=0;
  const addView=index=>{
    if(viewMap.has(index))return viewMap.get(index);
    const before=doc.bufferViews[index],offset=before.byteOffset||0,payload=binary.subarray(offset,offset+before.byteLength);
    const pad=(4-length%4)%4;if(pad){chunks.push(Buffer.alloc(pad));length+=pad;}
    const next=out.bufferViews.length;out.bufferViews.push({...clone(before),buffer:0,byteOffset:length});
    chunks.push(payload);length+=payload.length;viewMap.set(index,next);return next;
  };
  const addAccessor=index=>{
    if(accessorMap.has(index))return accessorMap.get(index);
    const a=clone(doc.accessors[index]);assert.ok(!a.sparse);if(a.bufferView!==undefined)a.bufferView=addView(a.bufferView);
    const next=out.accessors.length;out.accessors.push(a);accessorMap.set(index,next);return next;
  };
  const addMaterial=index=>{if(!materialMap.has(index)){materialMap.set(index,out.materials.length);out.materials.push(clone(doc.materials[index]));}return materialMap.get(index);};
  for(const index of roots){
    if(gone.includes(index))continue;
    const node=doc.nodes[index];assert.ok(!node.children?.length,'nested nodes are not supported');
    const next={...clone(node)};
    if(node.mesh!==undefined){
      const mesh=clone(doc.meshes[node.mesh]);
      for(const p of mesh.primitives){
        p.attributes=Object.fromEntries(Object.entries(p.attributes).map(([k,v])=>[k,addAccessor(v)]));
        if(p.indices!==undefined)p.indices=addAccessor(p.indices);
        if(p.material!==undefined)p.material=addMaterial(p.material);
        const draco=p.extensions?.KHR_draco_mesh_compression;if(draco)draco.bufferView=addView(draco.bufferView);
      }
      next.mesh=out.meshes.length;out.meshes.push(mesh);
    }
    out.scenes[0].nodes.push(out.nodes.length);out.nodes.push(next);
  }
  out.buffers[0].byteLength=length;
  return{bytes:encodeGlb(out,Buffer.concat(chunks,length)),removed:gone.map(i=>doc.nodes[i].name)};
}

function stripStructures(structures,removed){
  const removedStructures=new Set(structures.filter(r=>r.kind==='structure'&&r.meshIds?.length&&r.meshIds.every(id=>removed.has(id))).map(r=>r.id));
  return structures.filter(r=>!removedStructures.has(r.id)).map(r=>{
    const next={...r};
    for(const key of ['meshIds','directMeshIds'])if(Array.isArray(r[key]))next[key]=r[key].filter(id=>!removed.has(id));
    for(const key of ['childIds','parentIds'])if(Array.isArray(r[key]))next[key]=r[key].filter(id=>!removedStructures.has(id));
    return next;
  });
}

const report=[];
for(const name of fs.readdirSync(models).sort()){
  const dir=path.join(models,name),manifestFile=path.join(dir,'manifest.json');
  if(!fs.existsSync(manifestFile))continue;
  const manifest=read(manifestFile);
  const meshFile=path.join(dir,manifest.geometryFile||'meshes.json');if(!fs.existsSync(meshFile))continue;
  const meshes=read(meshFile);if(!Array.isArray(meshes))continue;
  const removed=new Set(meshes.filter(m=>isNonCommercialLicense(m.license)&&(!only||only.includes(m.id))).map(m=>m.id));
  if(!removed.size)continue;
  report.push({package:name,removed:meshes.filter(m=>removed.has(m.id)).map(m=>`${m.id} ${m.nameEn} [${m.license}]`)});
  if(check)continue;
  for(const chunk of manifest.chunks||[]){
    if(!chunk.meshIds.some(id=>removed.has(id)))continue;
    const glb=path.join(dir,chunk.file),result=withoutNodes(glb,removed);
    assert.deepEqual(new Set(result.removed),new Set(chunk.meshIds.filter(id=>removed.has(id))),'GLB/manifest mismatch in '+chunk.file);
    fs.writeFileSync(glb,result.bytes);
    chunk.meshIds=chunk.meshIds.filter(id=>!removed.has(id));
    if('meshCount' in chunk)chunk.meshCount=chunk.meshIds.length;
    if('bytes' in chunk)chunk.bytes=result.bytes.length;
    if('sha256' in chunk)chunk.sha256=sha(result.bytes);
  }
  const kept=meshes.filter(m=>!removed.has(m.id));
  if('geometryMeshCount' in manifest)manifest.geometryMeshCount=kept.length;
  if('triangleCount' in manifest)manifest.triangleCount-=meshes.filter(m=>removed.has(m.id)).reduce((s,m)=>s+(m.triangles||0),0);
  if('totalGlbBytes' in manifest)manifest.totalGlbBytes=(manifest.chunks||[]).reduce((s,c)=>s+(c.bytes||0),0);
  manifest.nonCommercialRemoved={meshIds:[...removed],reason:'CC BY-NC source surfaces are not distributed in the commercial build.'};
  writeJson(meshFile,kept);
  const structuresFile=path.join(dir,manifest.structuresFile||'structures.json');
  if(fs.existsSync(structuresFile)){
    const structures=stripStructures(read(structuresFile),removed);
    if('structureCount' in manifest)manifest.structureCount=structures.length;
    writeJson(structuresFile,structures);
  }
  writeJson(manifestFile,manifest);
}
console.log(JSON.stringify(report,null,1));
if(check&&report.length)process.exitCode=1;
