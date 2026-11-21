# JIN Anatomy Studio — model data

The 3D model data shipped in [JIN Anatomy Studio](https://github.com/hhj2028/jin-anatomy-studio) 1.0.24, published so that anyone can reuse it under the same terms as its sources. This repository holds **model data only**; the application code is not included.

## Licence

- Adapted model data (registered, connected, trimmed, re-encoded or otherwise modified surfaces) is licensed **CC BY-SA 4.0**, like the Z-Anatomy and Open3D sources it adapts.
- Surfaces kept from BodyParts3D, the Human Reference Atlas (HRA) and SPARC remain under their original **CC BY 4.0** terms.
- `assets/open3d-muscle-tile.jpg` and the muscle/tendon textures inside the Open3D GLBs are original textures made for this app (`tools/make_muscle_textures.ps1`), licensed CC BY-SA 4.0.
- Each `models/<package>/ATTRIBUTION.txt` names the authors, the original source, its licence and the changes made. Per-surface licences are in each package's `meshes.json` (`license`).

See [LICENSE.md](LICENSE.md).

## Not included (non-commercial sources)

The app is sold, so nothing under a non-commercial licence is distributed:

- University of Dundee inner-ear surfaces (vestibule, cochlea; CC BY-NC-SA 4.0) were removed from the Z-Anatomy data.
- Open3D/AnatomyTOOL muscle textures credited to UBC "Thoracic walls" (CC BY-NC-SA 4.0) were replaced by original textures; geometry and UVs are unchanged.
- The two Z-Anatomy kidney surfaces carry the original BodyParts3D FJ3145/FJ3147 geometry (CC BY 4.0) instead of the Z-Anatomy copy, whose credit list names a CC BY-NC kidney.

The scripts that made these changes are in `tools/`.

## Format

Geometry is Draco-compressed glTF (`.glb`, extension `KHR_draco_mesh_compression`), metres, +Y up, +Z front, +X left. Each package has `manifest.json` (chunks, sha256, coordinate notes), `meshes.json` (per-surface metadata and licence) and `structures.json` (named hierarchy).

## Packages (93)

| Package | Source | Licences |
|---|---|---|
| `bodyparts3d` | BodyParts3D | CC BY 4.0 |
| `bp-body-hepatic-veins` | BodyParts3D | CC BY 4.0 |
| `bp-body-orbital-nerves` | BodyParts3D | CC BY 4.0 |
| `hra-female` | HRA Female Pelvis | CC BY 4.0 |
| `hra-female-abdomen` | HRA Female Hepatobiliary | CC BY 4.0 |
| `hra-female-cardiac` | HRA Female Cardiac Reference | CC BY 4.0 |
| `hra-female-respiratory` | HRA Female Lungs and Airways | CC BY 4.0 |
| `hra-female-viscera` | HRA Female Colonic and Renal Continuation | CC BY 4.0 |
| `inner-ear-labyrinth` | Human Bony Labyrinth (Wimmer et al. 2019) | CC BY 4.0 |
| `open3d-aligned-overview` | Open3D Anatomy — Aligned right-sided overview | CC BY-SA 4.0 |
| `open3d-hand` | Open3D Anatomy — Hand | CC BY-SA 4.0 |
| `open3d-inguinal-canal` | Open3D Anatomy — Male inguinal and femoral regions | CC BY-SA 4.0 |
| `open3d-muscles-thorax-abdomen` | Open3D Anatomy — Muscles of thorax, abdomen and back | CC BY-SA 4.0 |
| `open3d-native-left` | Open3D Anatomy — Native left components | CC BY-SA 4.0 |
| `open3d-pelvicfloor` | Open3D Anatomy — Male pelvis and perineum | CC BY-SA 4.0 |
| `open3d-spinal-cord` | Open3D Anatomy — Spinal cord section | CC BY-SA 4.0 |
| `sparc-f002-vagus-independent` | SPARC f002 Left Vagus — reconstructed specimen course | CC BY 4.0 |
| `vmra-axillary-boundary` | Right Axillary vein · Source-derived boundary | CC BY-SA 4.0 |
| `vmra-cardiac-aortic-root` | Ascending aorta — source-derived accommodation | CC BY-SA 4.0 |
| `vmra-cardiac-block` | Cardiac block — source-derived placement | CC BY-SA 4.0 |
| `vmra-coupled-central-veins` | Central venous course accommodation | CC BY-SA 4.0 |
| `vmra-duodenal-plexus` | VMRA illustrative lower-duodenal autonomic branches | CC BY-SA 4.0 |
| `vmra-female-ovarian-supply` | VMRA illustrative female ovarian neurovascular courses | CC BY 4.0 |
| `vmra-female-pelvic-nerves` | VMRA illustrative female pelvic autonomic courses | CC BY 4.0 |
| `vmra-gastric-arterial` | VMRA registered gastric arteries | CC BY-SA 4.0 |
| `vmra-inferior-mesenteric-plexus` | VMRA illustrative inferior mesenteric plexus | CC BY-SA 4.0 |
| `vmra-lower-bowel` | VMRA source-derived lower bowel | CC BY-SA 4.0 |
| `vmra-mesenteric-plexus` | VMRA illustrative superior mesenteric plexus | CC BY-SA 4.0 |
| `vmra-pancreatic-atlas` | VMRA pancreatic branch atlas | CC BY-SA 4.0 |
| `vmra-pancreatic-plexus` | VMRA illustrative pancreatic-head autonomic pathway | CC BY-SA 4.0 |
| `vmra-proximal-vascular` | Proximal vascular source accommodation | CC BY-SA 4.0 |
| `vmra-pulmonary-lobes-veins` | Pulmonary lobes and venous branches — source-derived placement | CC BY-SA 4.0 |
| `vmra-rectal-interface` | VMRA source-derived native rectal interfaces | CC BY-SA 4.0 |
| `vmra-right-intestinal-block` | VMRA source-derived right intestinal block | CC BY-SA 4.0 |
| `vmra-splenic-plexus` | VMRA illustrative splenic plexus | CC BY-SA 4.0 |
| `vmra-subclavian-boundary` | Right subclavian vein · Source-derived boundary | CC BY-SA 4.0 |
| `vmra-thoracic-arterial-source` | Z-Anatomy | CC BY-SA 4.0 |
| `vmra-thoracic-venous-source` | Original proximal venous supports | CC BY-SA 4.0 |
| `z-anatomy` | Z-Anatomy | CC BY 4.0, CC BY-SA 4.0 |
| `z-body-abdomen` | Z-Anatomy | CC BY-SA 4.0 |
| `z-body-accessory-viscera` | Z-Anatomy | CC BY-SA 4.0 |
| `z-body-arm-attachments` | Z-Anatomy | CC BY-SA 4.0 |
| `z-body-bilateral-support` | Z-Anatomy | CC BY-SA 4.0 |
| `z-body-cerebral-continuity` | Z-Anatomy | CC BY-SA 4.0 |
| `z-body-core-viscera` | Z-Anatomy | CC BY-SA 4.0 |
| `z-body-cranial-dura` | Z-Anatomy | CC BY-SA 4.0 |
| `z-body-cystic-node` | Z-Anatomy | CC BY-SA 4.0 |
| `z-body-diaphragmatic-fascia` | Z-Anatomy | CC BY-SA 4.0 |
| `z-body-elbow-ligaments` | Z-Anatomy | CC BY-SA 4.0 |
| `z-body-epiglottis` | Z-Anatomy | CC BY-SA 4.0 |
| `z-body-eyes` | Z-Anatomy | CC BY-SA 4.0 |
| `z-body-face-muscles` | Z-Anatomy | CC BY-SA 4.0 |
| `z-body-gallbladder` | Z-Anatomy | CC BY-SA 4.0 |
| `z-body-head` | Z-Anatomy | CC BY-SA 4.0 |
| `z-body-intrarenal-veins` | Z-Anatomy | CC BY-SA 4.0 |
| `z-body-investing-abdominal-fascia` | Z-Anatomy | CC BY-SA 4.0 |
| `z-body-knee-medial-ligament` | Z-Anatomy | CC BY-SA 4.0 |
| `z-body-left-lower-limb` | Z-Anatomy | CC BY-SA 4.0 |
| `z-body-left-supply` | Z-Anatomy | CC BY-SA 4.0 |
| `z-body-left-trunk` | Z-Anatomy | CC BY-SA 4.0 |
| `z-body-left-upper-limb` | Z-Anatomy | CC BY-SA 4.0 |
| `z-body-left-wall` | Z-Anatomy | CC BY-SA 4.0 |
| `z-body-male-external` | Z-Anatomy | CC BY-SA 4.0 |
| `z-body-male-pelvis` | Z-Anatomy | CC BY-SA 4.0 |
| `z-body-missing-bilateral-muscles` | Z-Anatomy | CC BY-SA 4.0 |
| `z-body-oral` | Z-Anatomy | CC BY-SA 4.0 |
| `z-body-original-airways` | Z-Anatomy | CC BY-SA 4.0 |
| `z-body-original-ear-surfaces` | Z-Anatomy | CC BY-SA 4.0 |
| `z-body-original-levator-arches` | Z-Anatomy | CC BY-SA 4.0 |
| `z-body-original-search-surfaces` | Z-Anatomy | CC BY-SA 4.0 |
| `z-body-original-support-organs` | Z-Anatomy | CC BY-SA 4.0 |
| `z-body-original-tmj-ligaments` | Z-Anatomy | CC BY-SA 4.0 |
| `z-body-original-tmj-surfaces` | Z-Anatomy | CC BY-SA 4.0 |
| `z-body-pectoral-fascia` | Z-Anatomy | CC BY-SA 4.0 |
| `z-body-posterior-knee-ligaments` | Z-Anatomy | CC BY-SA 4.0 |
| `z-body-rectus-origins` | Z-Anatomy | CC BY-SA 4.0 |
| `z-body-renal` | Z-Anatomy | CC BY 4.0, CC BY-SA 4.0 |
| `z-body-reviewed-attachments` | Z-Anatomy | CC BY-SA 4.0 |
| `z-body-right-accessory-nerve` | Z-Anatomy | CC BY-SA 4.0 |
| `z-body-right-bilateral-finish` | Z-Anatomy | CC BY-SA 4.0 |
| `z-body-right-bilateral-muscles` | Z-Anatomy | CC BY-SA 4.0 |
| `z-body-right-composites` | Z-Anatomy | CC BY-SA 4.0 |
| `z-body-right-deep-cervical-artery` | Z-Anatomy | CC BY-SA 4.0 |
| `z-body-right-structural-peers` | Z-Anatomy | CC BY-SA 4.0 |
| `z-body-right-trunk` | Z-Anatomy | CC BY-SA 4.0 |
| `z-body-right-upper-limb-nerves` | Z-Anatomy | CC BY-SA 4.0 |
| `z-body-right-upper-limb-veins` | Z-Anatomy | CC BY-SA 4.0 |
| `z-body-submental-arteries` | Z-Anatomy | CC BY-SA 4.0 |
| `z-body-testicular-vessels` | Z-Anatomy | CC BY-SA 4.0 |
| `z-body-urinary-ducts` | Z-Anatomy | CC BY-SA 4.0 |
| `z-body-vagal-course` | Z-Anatomy | CC BY-SA 4.0 |
| `z-body-viscera` | Z-Anatomy | CC BY-SA 4.0 |
| `z-upper-abdomen` | Z-Anatomy | CC BY-SA 4.0 |
