// Replace the UBC-derived muscle/tendon texture images (CC BY-NC-SA 4.0, credited by
// AnatomyTOOL to "Thoracic walls", Claudia Krebs et al.) embedded in shipped GLBs with
// original procedurally generated textures (scripts/make_muscle_textures.ps1).
// Geometry, UVs, materials and every other image keep their exact bytes.
//
//   node scripts/replace_ubc_muscle_textures.mjs extract <dir>   write each target image once (<sha>.jpg) + targets.json
//   node scripts/replace_ubc_muscle_textures.mjs apply <dir>     swap in <dir>/out/<sha>.jpg, update manifests
//   node scripts/replace_ubc_muscle_textures.mjs check           exit 1 if any target image remains
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const models=path.join(root,'dist','models');
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
// Muscle and tendon tiles are the textures AnatomyTOOL credits to UBC. Bone, cartilage,
// capsule, ligament and organ images are Open3D's own CC BY-SA work and are kept.
export const UBC_TEXTURE_NAME=/muscle|tendon|diaphragm|trapezius|longissimus|extensor hood|nerve/i;
export const REPLACED_MARK='jin-original-texture';

function readGlb(file){
  const bytes=fs.readFileSync(file);assert.equal(bytes.toString('ascii',0,4),'glTF');
  const jsonLength=bytes.readUInt32LE(12),doc=JSON.parse(bytes.subarray(20,20+jsonLength).toString('utf8'));
  const start=20+jsonLength,binLength=bytes.readUInt32LE(start);
  assert.equal(bytes.toString('ascii',start+4,start+8),'BIN\0');
  return{doc,binary:bytes.subarray(start+8,start+8+binLength)};
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
const viewBytes=(doc,binary,index)=>{const v=doc.bufferViews[index];return binary.subarray(v.byteOffset||0,(v.byteOffset||0)+v.byteLength);};
const isTarget=image=>UBC_TEXTURE_NAME.test(image.name||'')&&!String(image.name).includes(REPLACED_MARK);

function* glbFiles(){
  for(const pkg of fs.readdirSync(models).sort()){
    const manifestFile=path.join(models,pkg,'manifest.json');if(!fs.existsSync(manifestFile))continue;
    const manifest=JSON.parse(fs.readFileSync(manifestFile,'utf8'));
    for(const chunk of manifest.chunks||[]){const file=path.join(models,pkg,chunk.file);if(fs.existsSync(file))yield{pkg,manifestFile,chunk,file};}
  }
}

const [mode,dirArg]=process.argv.slice(2);
if(mode==='extract'){
  const dir=path.resolve(dirArg);fs.mkdirSync(dir,{recursive:true});const targets={};
  for(const {file} of glbFiles()){
    const {doc,binary}=readGlb(file);
    for(const image of doc.images||[]){
      if(!isTarget(image))continue;
      const bytes=viewBytes(doc,binary,image.bufferView),key=sha(bytes);
      assert.equal(image.mimeType,'image/jpeg',image.name);
      if(!targets[key]){fs.writeFileSync(path.join(dir,key+'.jpg'),bytes);targets[key]={name:image.name,normal:/normal/i.test(image.name),uses:0};}
      targets[key].uses++;
    }
  }
  fs.writeFileSync(path.join(dir,'targets.json'),JSON.stringify(targets,null,1));
  console.log(Object.keys(targets).length,'distinct images');
}else if(mode==='apply'){
  const out=path.resolve(dirArg,'out');let swapped=0;const touched=new Map();
  for(const {pkg,manifestFile,chunk,file} of glbFiles()){
    const {doc,binary}=readGlb(file);
    const targets=(doc.images||[]).map((image,i)=>isTarget(image)?i:-1).filter(i=>i>=0);
    if(!targets.length)continue;
    const replacement=new Map(targets.map(i=>{
      const key=sha(viewBytes(doc,binary,doc.images[i].bufferView)),next=path.join(out,key+'.jpg');
      assert.ok(fs.existsSync(next),'missing replacement '+key);return[doc.images[i].bufferView,fs.readFileSync(next)];
    }));
    // Re-lay every buffer view in order; only replaced image payloads change.
    const chunks=[];let length=0;
    doc.bufferViews=doc.bufferViews.map((view,index)=>{
      const payload=replacement.get(index)||viewBytes(doc,binary,index);
      const pad=(4-length%4)%4;if(pad){chunks.push(Buffer.alloc(pad));length+=pad;}
      const next={...view,byteOffset:length,byteLength:payload.length};chunks.push(payload);length+=payload.length;return next;
    });
    for(const i of targets)doc.images[i].name=`${doc.images[i].name} (${REPLACED_MARK})`;
    doc.buffers[0].byteLength=length;
    const bytes=encodeGlb(doc,Buffer.concat(chunks,length));fs.writeFileSync(file,bytes);swapped+=targets.length;
    if('bytes' in chunk)chunk.bytes=bytes.length;if('sha256' in chunk)chunk.sha256=sha(bytes);
    touched.set(manifestFile,(touched.get(manifestFile)||[]).concat(chunk));
  }
  for(const manifestFile of touched.keys()){
    const manifest=JSON.parse(fs.readFileSync(manifestFile,'utf8')),updated=touched.get(manifestFile);
    for(const chunk of manifest.chunks){const u=updated.find(c=>c.file===chunk.file);if(u)Object.assign(chunk,{bytes:u.bytes,sha256:u.sha256});}
    if('totalGlbBytes' in manifest)manifest.totalGlbBytes=manifest.chunks.reduce((s,c)=>s+(c.bytes||0),0);
    manifest.ubcTexturesReplaced='UBC-derived muscle/tendon textures (CC BY-NC-SA 4.0) replaced with original JIN Anatomy Studio textures; geometry and UVs unchanged.';
    const raw=fs.readFileSync(manifestFile,'utf8');
    fs.writeFileSync(manifestFile,JSON.stringify(manifest)+(/\n$/.test(raw)?'\n':''));
  }
  console.log(swapped,'images replaced in',touched.size,'packages');
}else if(mode==='check'){
  const left=[];
  for(const {file} of glbFiles()){const {doc}=readGlb(file);for(const image of doc.images||[])if(isTarget(image))left.push(path.relative(root,file)+' '+image.name);}
  console.log(JSON.stringify(left,null,1));if(left.length)process.exitCode=1;
}else{
  console.error('usage: extract <dir> | apply <dir> | check');process.exitCode=2;
}
