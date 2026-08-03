# dff-reader

A TypeScript library for parsing GTA RenderWare `.dff` model files. Works in both **Node.js** and the **browser** (uses `Uint8Array` / `fetch`-compatible input).

> **⚠️ AI Disclaimer**
> Versions **v1.0.14 and above** have been modified with AI assistance. If you need the version that was written entirely by hand, use **v1.0.13**:
> ```
> npm install @majesticfudgie/dff-reader@1.0.13
> ```

---

## Installation

```bash
npm install @majesticfudgie/dff-reader
```

---

## Usage

### Browser (via `fetch`)

```ts
import DFFReader from '@majesticfudgie/dff-reader';

const response = await fetch('/models/banshee.dff');
const buffer = await response.arrayBuffer();
const dff = new DFFReader(new Uint8Array(buffer));

const geometry = dff.getGeometry();
console.log(geometry);
```

### Node.js

```ts
import fs from 'fs';
import DFFReader from '@majesticfudgie/dff-reader';

const data = new Uint8Array(fs.readFileSync('banshee.dff'));
const dff = new DFFReader(data);

const geometry = dff.getGeometry();
console.log(geometry);
```

---

## API

### `new DFFReader(data: Uint8Array)`

Creates a new reader and immediately parses the file. Throws if the data is malformed.

| Parameter | Type | Description |
|---|---|---|
| `data` | `Uint8Array` | Raw bytes of the `.dff` file |

---

### `dff.getGeometry(): Geometry[]`

Returns an array of parsed geometry objects, one per atomic/mesh in the file. This is the main method you'll use to get renderable data.

Each `Geometry` object contains:

| Property | Type | Description |
|---|---|---|
| `name` | `string` | Frame name for this mesh |
| `format` | `number` | Raw RpGeometry format flags |
| `formatName` | `"list" \| "strip"` | Triangle storage mode |
| `numTriangles` | `number` | |
| `numVertices` | `number` | |
| `vertices` | `{ x, y, z }[]` | Vertex positions |
| `triangles` | `Triangle[]` | Face indices and material IDs |
| `normals` | `{ x, y, z }[]` | Per-vertex normals (may be empty) |
| `uvs` | `{ u, v }[][]` | UV sets (index 0 = primary) |
| `vertexColours` | `RGBA[]` | Pre-lit vertex colours (0–255) |
| `nightVertexColours` | `RGBA[] \| undefined` | Night-time vertex colours (SA extension) |
| `materials` | `Material[]` | Material/texture info |
| `effect` | `Base2DEffectChunk \| undefined` | 2D effects (lights, particles, etc.) |
| `skin` | `SkinChunk \| undefined` | Per-vertex bone indices/weights + bone inverse matrices (SkinPLG), present on skinned meshes (peds, some vehicles) |
| `position` | `{ x, y, z }` | Frame position |
| `rotationMatrix` | `{ right, up, at }` | Frame rotation matrix |
| `parentIndex` | `number` | Parent frame index (-1 = root) |
| `matrixFlags` | `number` | Raw matrix flags |
| `animData` | `any` | HAnimPLG data if present |

#### `Triangle`

```ts
{
  vertex1: number,
  vertex2: number,
  vertex3: number,
  materialId: number,  // index into geometry.materials
}
```

#### `Material`

```ts
// Untextured
{
  isTextured: false,
  color: { r, g, b, a },  // 0–255
  ambient: number,
  specular: number,
  diffuse: number,
  uvAnimation?: {            // present if this material has a scrolling/flashing UV animation
    channelMask: number,
    channels: { slot: number, name: string }[],  // look up via dff.getUVAnimation(name)
  },
}

// Textured
{
  isTextured: true,
  color: { r, g, b, a },
  ambient: number,
  specular: number,
  diffuse: number,
  texture: {
    textureName: string,       // TXD texture name to look up
    textureAlphaName: string,
    filteringMode: number,
    uAddressing: number,
    vAddressing: number,
    mipLevels: number,
  },
  uvAnimation?: {
    channelMask: number,
    channels: { slot: number, name: string }[],
  },
}
```

---

### `dff.getNode(): GeometryNode`

Returns the scene hierarchy as a tree. Useful when you need parent/child frame relationships rather than a flat list.

```ts
interface GeometryNode {
  name: string,
  position: { x, y, z },
  rotationMatrix: { right, up, at },
  matrixFlags: number,
  children: (GeometryNode | Geometry)[],
}
```

---

### `dff.parsed: RawChunk`

The raw parsed chunk tree, useful for debugging or accessing chunk types not yet covered by the higher-level API.

---

### `dff.uvAnimationDictionary: RawChunk | undefined`

Set when the file has a top-level UV Animation Dictionary — present on models with scrolling/flashing UV-animated
textures (e.g. casino signs/lights). Its `children` are the individual animations (`ChunkTypes.Anim_Animation`).
Each material returned by `getGeometry()` that references an animation exposes it via `material.uvAnimation`
(the channel name(s) to look up here).

---

### `dff.getUVAnimation(name: string): AnimAnimationChunk | undefined`

Looks up a UV animation by name from `dff.uvAnimationDictionary` — the name a material's
`uvAnimation.channels[n].name` references. Returns `undefined` if the file has no dictionary, or no entry with
that name.

```ts
const geometry = dff.getGeometry();
for (const material of geometry[0].materials) {
  for (const channel of material.uvAnimation?.channels ?? []) {
    const anim = dff.getUVAnimation(channel.name);
    // anim.duration, anim.numFrames, anim.keyFrames[]...
  }
}
```

---

### `dff.stripData(chunk: RawChunk): object`

Returns a copy of the chunk tree with raw binary `data` fields removed, suitable for `JSON.stringify`.

```ts
fs.writeFileSync('model.json', JSON.stringify(dff.stripData(dff.parsed), null, '\t'));
```

---

### `dff.searchChunk<T>(chunk: RawChunk, type: ChunkTypes): RawChunk<T>[]`

Recursively searches a chunk and all its children for chunks matching the given `ChunkTypes` enum value.

```ts
import ChunkTypes from '@majesticfudgie/dff-reader/build/enums/ChunkTypes';

const textures = dff.searchChunk(dff.parsed, ChunkTypes.Texture);
```

---

### `dff.toOBJ(geometry: Geometry): { obj: Uint8Array, mtl: Uint8Array }`

> **Deprecated** — does not produce a faithful model for all geometry types.

Converts a single `Geometry` to `.obj` and `.mtl` file contents. Returns raw UTF-8 bytes.

```ts
const { obj, mtl } = dff.toOBJ(geometry[0]);
fs.writeFileSync('model.obj', obj);
fs.writeFileSync('model.mtl', mtl);
```

---

## Supported Chunk Types

The parser handles the following RenderWare chunks:

- Clump, Frame List, Geometry List, Geometry, Atomic, Light
- Material List, Material, Texture, String
- Bin Mesh PLG, HAnim PLG, Skin PLG, Breakable
- 2D Effect (lights, particles, ped attractors, enter/exit, street signs, trigger points, cover points, escalators)
- Extra Vertex Colour (night vertex colours)
- UV Animation Dictionary, Anim Animation, UV Animation PLG (scrolling/flashing texture animation, e.g. casino signs)

---

## Supported Games

Primarily tested against **GTA San Andreas** assets. Should work with other RenderWare-based GTA titles (III, Vice City) with minor caveats around version-dependent fields.
