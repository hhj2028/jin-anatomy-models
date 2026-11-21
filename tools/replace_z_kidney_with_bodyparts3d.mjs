// Z-Anatomy's credit list names "Kidney - Lissie Cowley - CC BY-NC 4.0", and our earlier
// review attached that non-commercial licence to the two Z kidney surfaces. Their
// geometry is in fact BodyParts3D's: the left Z kidney is vertex-identical to
// BodyParts3D FJ3145 after one translation (0.05 mm quantization residual), and the
// right differs from FJ3147 only at a few edited vertices. To ship a sold app without
// any doubt, each Z kidney surface now carries the original BodyParts3D Draco payload
// (CC BY 4.0) placed by a glTF node translation into the Z frame. The surface IDs stay,
// so supply, CT, search and saved scenes keep working.
//
//   node scripts/replace_z_kidney_with_bodyparts3d.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),models=path.join(root,'dist','models');
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const read=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const writeJson=(file,value)=>fs.writeFileSync(file,JSON.stringify(value)+(/\n$/.test(fs.readFileSync(file,'utf8'))?'\n':''));
export const KIDNEYS=[
  {zId:'ZA_5fff604cbe9526',bpId:'FJ3145',nameEn:'Left Kidney'},
  {zId:'ZA_cf69dad3c0b6de',bpId:'FJ3147',nameEn:'Right Kidney'}
];
export const BP_LICENSE='CC-BY-4.0';

function readGlb(file){
  const bytes=fs.readFileSync(file),jsonLength=bytes.readUInt32LE(12);
  const doc=JSON.parse(bytes.subarray(20,20+jsonLength).toString('utf8')),start=20+jsonLength;
  assert.equal(bytes.toString('ascii',start+4,start+8),'BIN\0');
  return{doc,binary:bytes.subarray(start+8,start+8+bytes.readUInt32LE(start))};
}
function encodeGlb(doc,binary){
  const json=Buffer.from(JSON.stringify(doc),'utf8'),jsonPadding=(4-json.length%4)%4;
  const dataPadding=(4-binary.length%4)%4,total=12+8+json.length+jsonPadding+8+binary.length+dataPadding;
  const out=Buffer.alloc(total);out.write('glTF',0,'ascii');out.writeUInt32LE(2,4);out.writeUInt32LE(total,8);
  out.writeUInt32LE(json.length+jsonPadding,12);out.write('JSON',16,'ascii');
  json.copy(out,20);out.fill(0x20,20+json.length,20+json.length+jsonPadding);
  const start=20+json.length+jsonPadding;out.writeUInt32LE(binary.length+dataPadding,start);
  out.write('BIN\0',start+4,'ascii');binary.copy(out,start+8);return out;
}
const view=(doc,binary,i)=>{const v=doc.bufferViews[i];return binary.subarray(v.byteOffset||0,(v.byteOffset||0)+v.byteLength);};
const primitiveOf=(doc,name)=>{const node=doc.nodes.find(n=>n.name===name);assert.ok(node,name);return{node,primitive:doc.meshes[node.mesh].primitives[0]};};

// BodyParts3D source payloads.
const bpManifest=read(path.join(models,'bodyparts3d','manifest.json'));
const bpMeta=new Map(read(path.join(models,'bodyparts3d',bpManifest.geometryFile)).map(m=>[m.id,m]));
const bpChunk=bpManifest.chunks.find(c=>c.meshIds.includes('FJ3145'));
assert.ok(KIDNEYS.every(k=>bpChunk.meshIds.includes(k.bpId)));
const bpFile=path.join(models,'bodyparts3d',bpChunk.file),bp=readGlb(bpFile);
const source=new Map(KIDNEYS.map(k=>{
  const {primitive}=primitiveOf(bp.doc,k.bpId),draco=primitive.extensions.KHR_draco_mesh_compression;
  return[k.zId,{payload:Buffer.from(view(bp.doc,bp.binary,draco.bufferView)),dracoAttributes:draco.attributes,
    accessors:Object.fromEntries([...Object.entries(primitive.attributes),['indices',primitive.indices]].map(([key,i])=>[key,bp.doc.accessors[i]])),
    material:bp.doc.materials[primitive.material]}];
}));

function replaceIn(pkg,translations){
  const dir=path.join(models,pkg),manifestFile=path.join(dir,'manifest.json'),manifest=read(manifestFile);
  const chunk=manifest.chunks.find(c=>KIDNEYS.every(k=>c.meshIds.includes(k.zId)));assert.ok(chunk,pkg);
  const file=path.join(dir,chunk.file),{doc,binary}=readGlb(file),replacement=new Map();
  for(const k of KIDNEYS){
    const {node,primitive}=primitiveOf(doc,k.zId),src=source.get(k.zId),draco=primitive.extensions.KHR_draco_mesh_compression;
    if(node.extras?.geometrySource==='BodyParts3D '+k.bpId)return console.log(pkg,'already replaced');
    assert.deepEqual(draco.attributes,src.dracoAttributes,'draco attribute layout');
    assert.deepEqual(doc.materials[primitive.material],src.material,'material');
    replacement.set(draco.bufferView,src.payload);
    for(const [key,i] of [...Object.entries(primitive.attributes),['indices',primitive.indices]])
      doc.accessors[i]={...src.accessors[key]};
    node.translation=translations.get(k.zId);
    node.extras={...node.extras,geometrySource:'BodyParts3D '+k.bpId,geometryLicense:BP_LICENSE};
  }
  const chunks=[];let length=0;
  doc.bufferViews=doc.bufferViews.map((v,i)=>{
    const payload=replacement.get(i)||view(doc,binary,i),pad=(4-length%4)%4;if(pad){chunks.push(Buffer.alloc(pad));length+=pad;}
    const next={...v,byteOffset:length,byteLength:payload.length};chunks.push(payload);length+=payload.length;return next;
  });
  doc.buffers[0].byteLength=length;
  const bytes=encodeGlb(doc,Buffer.concat(chunks,length));fs.writeFileSync(file,bytes);
  chunk.bytes=bytes.length;chunk.sha256=sha(bytes);
  const metaFile=path.join(dir,manifest.geometryFile||'meshes.json'),meshes=read(metaFile);let triangleDelta=0;
  for(const k of KIDNEYS){
    const row=meshes.find(m=>m.id===k.zId),bpRow=bpMeta.get(k.bpId),t=translations.get(k.zId);
    triangleDelta+=bpRow.triangles-row.triangles;
    Object.assign(row,{vertices:bpRow.vertices,triangles:bpRow.triangles,dracoBytes:source.get(k.zId).payload.length,
      bounds:bpRow.bounds.map(v=>v.map((x,i)=>x+t[i])),license:BP_LICENSE,
      additionalAttribution:'Geometry: BodyParts3D, © The Database Center for Life Science, CC BY 4.0 ('+k.bpId+', translated into the Z-Anatomy frame). Not the CC BY-NC kidney credited in Z-Anatomy.',
      geometrySource:{dataset:'BodyParts3D 4.0',meshId:k.bpId,license:BP_LICENSE,translationMetres:t}});
    if('sourceTriangles' in row)row.sourceTriangles=bpRow.triangles;
  }
  writeJson(metaFile,meshes);
  if('triangleCount' in manifest)manifest.triangleCount+=triangleDelta;
  if('totalGlbBytes' in manifest)manifest.totalGlbBytes=manifest.chunks.reduce((s,c)=>s+(c.bytes||0),0);
  manifest.kidneyGeometry='Left/Right Kidney surfaces carry the original BodyParts3D FJ3145/FJ3147 payloads (CC BY 4.0) placed by node translation; IDs kept.';
  writeJson(manifestFile,manifest);
  console.log(pkg,'replaced',chunk.file);
}

// One rigid translation per kidney, from the authored Z bounds to the BodyParts3D bounds
// (min corner). Measured before any change; both sides agree to ~0.2 mm.
const translations=new Map();
const zMeta=new Map(read(path.join(models,'z-body-renal','meshes.json')).map(m=>[m.id,m]));
for(const k of KIDNEYS){
  const z=zMeta.get(k.zId),b=bpMeta.get(k.bpId);
  if(z.geometrySource)translations.set(k.zId,z.geometrySource.translationMetres);
  else translations.set(k.zId,[0,1,2].map(i=>Math.round((z.bounds[0][i]-b.bounds[0][i])*1e5)/1e5));
}
console.log(JSON.stringify(Object.fromEntries(translations)));
for(const pkg of ['z-body-renal','z-anatomy'])replaceIn(pkg,translations);
