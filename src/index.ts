import path from "path";
import fs from 'fs';
import Util from "./Util";
import PointerBuffer from "./PointerBuffer";
import ChunkTypes from "./enums/ChunkTypes";
import GeometryFormat from "./enums/GeometryFormat";
import AtomicFlags from "./enums/AtomicFlags";
import RawChunk from "./interfaces/RawChunk";
import Geometry from "./interfaces/Geometry";
import GeometryChunk from "./interfaces/chunks/GeometryChunk";
import Material from "./interfaces/Material";
import AtomicChunk from "./interfaces/chunks/AtomicChunk";

class DFFReader {

	public rawData: PointerBuffer;
	public parsed: RawChunk;

	constructor(protected data: Buffer) {
		this.rawData = new PointerBuffer(data);
		this.parsed = this.parseFile();

	}

	public parseFile(): RawChunk {
		return this.parseChunk(this.rawData);
	}

	parseChunk(buf: PointerBuffer): RawChunk {

		const sectionHeader = buf.readSection(12);

		const sectionType = sectionHeader.readUint32LE(0);
		const sectionSize = sectionHeader.readUint32LE(4);
		const sectionLibrary = sectionHeader.readUint32LE(8);
		const sectionContent = buf.readSection(sectionSize);

		const chunk: RawChunk = {
			type: sectionType,
			typeName: Util.GetChunkName(sectionType),
			size: sectionSize,
			libraryId: sectionLibrary,
			version: {
				library: Util.libraryIDUnpackVersion(sectionLibrary),
				build: Util.libraryIDUnpackBuild(sectionLibrary),
			},
			data: sectionContent,
		};

		const childrenChunks: RawChunk[] = [];

		const containerTypes = [
			ChunkTypes.Extension, // Extension
			ChunkTypes.Material, // Material
			ChunkTypes.Material_List, // Material List
			ChunkTypes.Clump, // Clump
			ChunkTypes.Frame_List, // Frame List
			ChunkTypes.Geometry_List, // Geometry List
			ChunkTypes.Geometry, // Geometry
			ChunkTypes.Atomic, // Atomic
			ChunkTypes.Texture, // Texture
		];

		if (containerTypes.includes(chunk.type)) {
			let maxLoop = 1000;
			const content = new PointerBuffer(sectionContent);
			while (content.hasMore && maxLoop > -1) {
				const cType = content.readUint32();
				const cSize = content.readUint32();
				const cLibrary = content.readUint32();

				// Rewind the buffer and read the whole section out of it.
				content.backward(12);
				const wholeChunk = content.readSection(12 + cSize);
				
				childrenChunks.push(this.parseChunk(new PointerBuffer(wholeChunk)));

				maxLoop--;
			}
			if (maxLoop <= 0) {
				console.warn("HIT MAX LOOP!");
			}
		}

		if (childrenChunks.length > 0 ) {
			chunk.children = childrenChunks;
		}

		// Handle parsing

		if (chunk.type === ChunkTypes.Clump) {
			// Clump
			if (childrenChunks.length > 0 ) {
				const firstChild = childrenChunks[0];
				if (firstChild.type === ChunkTypes.Struct) {
					const content = new PointerBuffer(firstChild.data);

					const numAtomics = content.readDWORD();
					const numLights = content.readDWORD();
					const numCameras = content.readDWORD();

					chunk.parsed = {
						numAtomics,
						numLights,
						numCameras,
					};
				}
			}
		} else if (chunk.type === ChunkTypes.Frame_List) {
			// Frame List
			if (childrenChunks.length > 0 ) {
				const firstChild = childrenChunks[0];
				if (firstChild.type === ChunkTypes.Struct) {
					const content = new PointerBuffer(firstChild.data);

					const frameCount = content.readDWORD();

					let frames: object[] = [];

					for (let i=0; i<frameCount; i++) {
						const rotationMatrix = {
							right: {
								x: 0, y: 0, z: 0,
							},
							up: {
								x: 0, y: 0, z: 0,
							},
							at: {
								x: 0, y: 0, z: 0,
							},
						}

						rotationMatrix.right.x = content.readFloat();
						rotationMatrix.right.y = content.readFloat();
						rotationMatrix.right.z = content.readFloat();

						rotationMatrix.up.x = content.readFloat();
						rotationMatrix.up.y = content.readFloat();
						rotationMatrix.up.z = content.readFloat();

						rotationMatrix.at.x = content.readFloat();
						rotationMatrix.at.y = content.readFloat();
						rotationMatrix.at.z = content.readFloat();

						const position = {
							x: 0, y: 0, z: 0,
						};

						position.x = content.readFloat();
						position.y = content.readFloat();
						position.z = content.readFloat();

						const parentIndex = content.readDWORD();
						const matrixFlags = content.readDWORD();

						frames.push({
							rotationMatrix,
							position,
							parentIndex,
							matrixFlags,
						});
					}

					chunk.parsed = {
						frameCount,
						frames,
					};
				}
			}

		} else if (chunk.type === ChunkTypes.Geometry_List) {
			// Geometry List
			if (childrenChunks.length > 0 ) {
				const firstChild = childrenChunks[0];
				if (firstChild.type === 0x00000001) {
					// Struct
					const content = new PointerBuffer(firstChild.data);
					const geometryCount = content.readDWORD();
					chunk.parsed = {
						geometryCount
					};
				}
			}
		} else if (chunk.type === ChunkTypes.Atomic) {
			// Atomic
			if (childrenChunks.length > 0 ) {
				const firstChild = childrenChunks[0];
				if (firstChild.type === ChunkTypes.Struct) {
					// Struct
					const content = new PointerBuffer(firstChild.data);
					const frameIndex = content.readUint32();
					const geometryIndex = content.readUint32();
					const flags = content.readUint32();

					chunk.parsed = {
						frameIndex,
						geometryIndex,
						flags,
						flagsInfo: (flags === AtomicFlags.rpATOMICCOLLISIONTEST ? "rpATOMICCOLLISIONTEST" : "rpATOMICRENDER")
					};
				}
			}
		} else if (chunk.type === ChunkTypes.Breakable) {
			// Breakable
			const magicNumber = sectionContent.readUint32LE();
			chunk.parsed = {
				magicNumber
			};
		} else if (chunk.type === ChunkTypes.Bin_Mesh_PLG) {
			// Bin Mesh PLG
			const content = new PointerBuffer(sectionContent);

			const flags = content.readUint32();
			const numMeshes = content.readUint32();
			let meshInfo: any[] = [];

			for (let i=0; i<numMeshes; i++) {
				const numIndices = content.readUint32();
				const matIndex = content.readUint32();
				meshInfo.push({
					numIndices, matIndex
				});
			}

			chunk.parsed = {
				flags,
				flagsInfo: (flags === 0 ? "list" : "strip"),
				numMeshes,
				meshInfo,
			};
		} else if (chunk.type === ChunkTypes.Material_List) {
			// Material list
			if (childrenChunks.length > 0 ) {
				const firstChild = childrenChunks[0];
				if (firstChild.type === 0x00000001) {
					// Struct
					const content = new PointerBuffer(firstChild.data);
					const materialCount = content.readDWORD();

					const materialIndices: number[] = [];

					for (let i=0; i<materialCount; i++) {
						materialIndices.push( content.readDWORD() );
					}

					chunk.parsed = {
						materialCount,
						materialIndices,
					};
				}
			}
		} else if (chunk.type === ChunkTypes.Geometry) {
			// Geometry
			if (childrenChunks.length > 0) {
				const firstChild = childrenChunks[0];
				if (firstChild.type === ChunkTypes.Struct) {
					// Struct
					// https://gtamods.com/wiki/RpGeometry#Format
					const content = new PointerBuffer(firstChild.data);

					const format = content.readDWORD();
					content.rewind();
					const rawFormat = content.readSection(4);

					if (format & GeometryFormat.rpGEOMETRYTRISTRIP) {
						console.log("Strip")
					} else {
						console.log("List");
					}
					
					const numTriangles = content.readDWORD();
					const numVertices = content.readDWORD();
					const numMorphTargets = content.readDWORD();

					// We'll read them but not use them.
					if (chunk.version.library < 0x34000) {
						const ambient = content.readFloat();
						const specular = content.readFloat();
						const diffuse = content.readFloat();
					}

					const triangles: {
						vertex1: number,
						vertex2: number,
						vertex3: number,
						materialId: number,
					}[] = [];

					const vertices: {
						x: number,
						y: number,
						z: number,
					}[] = [];

					const morphTargets: {
						boundingSphereX: number,
						boundingSphereY: number,
						boundingSphereZ: number,
						boundingSphereRadius: number,
						hasPosition: number,
						hasNormals: number,
					}[] = [];
					const uvs: { u: number, v: number }[][] = [];
					const normals: {
						x: number,
						y: number,
						z: number,
					}[] = [];

					const vertexColours: {
						r: number,
						g: number,
						b: number,
						a: number,
					}[] = [];

					// Builds our material list.
					const materialList: { textureName: string }[] = [];
					for (let child of childrenChunks) {
						if (child.type === ChunkTypes.Material_List) {
							if (child.children) {
								for (let cchild of child.children) {
									if (cchild.type === ChunkTypes.Material) {
										const materialChild = cchild;
										if (materialChild.children) {
											for (let mChild of materialChild.children) {
												if (mChild.type !== ChunkTypes.Texture) {
													continue;
												}
												const mat = mChild as { parsed: { textureName: string } };
												materialList.push({
													textureName: mat.parsed.textureName
												});
											}
										}
									}
								}
							}
						}
					}

					// Contains triangles
					if ((format & GeometryFormat.rpGEOMETRYNATIVE) === 0) {

						// Colour information - Pre Lit Data
						if ( (format & GeometryFormat.rpGEOMETRYPRELIT) ) {
							console.log("Has Lighting Data");
							// Read colour data
							for (let i=0; i<numVertices; i++) {
								const [r, g, b, a ] = content.readSection(4);
								vertexColours.push({
									r, g, b, a
								});
							}
						}
						

						// Sanity was saved by
						// https://github.com/Parik27/DragonFF/blob/master/gtaLib/dff.py#L1473
						if (format & (GeometryFormat.rpGEOMETRYTEXTURED | GeometryFormat.rpGEOMETRYTEXTURED2)) {
							let texCount = (format & 0x00FF0000) >> 16;
							
							if (texCount === 0) {
								if (format & GeometryFormat.rpGEOMETRYTEXTURED2) {
									texCount = 2;
								} else if (format & GeometryFormat.rpGEOMETRYTEXTURED) {
									texCount = 1;
								} else {
									texCount = 0;
								}
							}

								
							for (let i=0; i<texCount; i++) {
								const uvSet: { u: number, v: number }[] = [];
								for (let i=0; i<numVertices; i++) {
									const u = content.readFloat();
									const v = content.readFloat();
									uvSet.push({ u, v });
								}
								uvs.push(uvSet);
							}
						}


						// Face Information (Triangles)
						for (let i=0; i<numTriangles; i++) {
							const vertex2 = content.readUint16();
							const vertex1 = content.readUint16();
							const materialId = content.readUint16();
							const vertex3 = content.readUint16();

							triangles.push({
								vertex2,
								vertex1,
								materialId,
								vertex3
							});

						}

						// Unknown (Morph Targets)
						console.log(`Has ${numMorphTargets} morph targets`);
						for (let i=0; i<numMorphTargets; i++) {
							const boundingSphereX = content.readFloat();
							const boundingSphereY = content.readFloat();
							const boundingSphereZ = content.readFloat();
							const boundingSphereRadius = content.readFloat();

							const hasPosition = content.readDWORD();
							const hasNormals = content.readDWORD();
							morphTargets.push({
								boundingSphereX,
								boundingSphereY,
								boundingSphereZ,
								boundingSphereRadius,
								hasPosition,
								hasNormals,
							});
						}

						// Vertex Information
						for (let i=0; i<numVertices; i++) {
							const x = content.readFloat();
							const y = content.readFloat();
							const z = content.readFloat();
							vertices.push({
								x, y, z
							});
						}

						// Normal Information
						if (format & GeometryFormat.rpGEOMETRYNORMALS) {
							console.log("Has normal data")
							for (let i=0; i<numVertices; i++) {
								const x = content.readFloat();
								const y = content.readFloat();
								const z = content.readFloat();
								normals.push({
									x, y, z
								});
							}
						}
					}

					for (let i=0; i<numMorphTargets; i++) {
						// Some more stuff
					}

					// 100% unsure how correct this is
					let formatName = "list";
					if (format & GeometryFormat.rpGEOMETRYTRISTRIP) {
						formatName = "strip";
					}

					chunk.parsed = {
						format,
						formatName,
						numTriangles,
						numVertices,
						numMorphTargets,
						triangles,
						vertices,
						normals,
						vertexColours,
						uvs,
					};
				}
			}
		} else if (chunk.type === ChunkTypes.Frame) {
			// Frame

			// Lazy way to do it.
			chunk.parsed = {
				name: sectionContent.toString(),
			};
		} else if (chunk.type === ChunkTypes.Texture) {
			// Texture
			if (childrenChunks.length >= 3) {
				const struct = childrenChunks[0];

				let filteringMode = 0x00;
				let uAddressing = 0;
				let vAddressing = 0;
				let mipLevels = 0;
				if (struct.type === ChunkTypes.Struct) {
					const content = new PointerBuffer(struct.data);

					filteringMode = content.readUint8();
					
					const addressing = content.readUint8();
					uAddressing = addressing & 0b00001111;
					vAddressing = (addressing >> 4) && 0b00001111;

					const mipLevelsByte = content.readUint8();
					// idk how to do this right this second.
					mipLevels = mipLevelsByte;

				}

				const textureNameChunk = childrenChunks[1];
				const textureAlphaChunk = childrenChunks[2];

				let textureName = "";
				let textureAlphaName = "";

				if (textureNameChunk.type === ChunkTypes.String) {
					textureName = textureNameChunk.parsed.value as string;
				}

				if (textureAlphaChunk.type === ChunkTypes.String) {
					textureAlphaName = textureAlphaChunk.parsed.value as string;
				}

				chunk.parsed = {
					filteringMode,
					uAddressing,
					vAddressing,
					mipLevels,

					textureName,
					textureAlphaName,
				};
			}
		} else if (chunk.type === ChunkTypes.String) {
			// String
			let str = "";
			const bytes = chunk.data;
			for (let i=0; bytes.length; i++) {
				const char = bytes[i];
				if (char === 0x00) {
					break;
				} else {
					str += String.fromCharCode(char);
				}
			}
			chunk.parsed = {
				value: str,
			};
		} else if (chunk.type === ChunkTypes.Material) {
			if (childrenChunks.length > 1) {
				const firstChild = childrenChunks[0];
				if (firstChild.type === ChunkTypes.Struct) {

					const content = new PointerBuffer(firstChild.data);

					const flags = content.readDWORD();
					const color = {
						r: 0,
						g: 0,
						b: 0,
						a: 0,
					};

					color.r = content.readUint8();
					color.g = content.readUint8();
					color.b = content.readUint8();
					color.a = content.readUint8();

					const unused = content.readDWORD();

					const isTextured = content.readUint32();

					let ambient = 0;
					let specular = 0;
					let diffuse = 0;

					if (chunk.version.library > 0x30400) {
						ambient = content.readFloat();
						specular = content.readFloat();
						diffuse = content.readFloat();
					}

					chunk.parsed = {
						color,
						isTextured,
						ambient,
						specular,
						diffuse,
					};
				}
			}
		}

		return chunk;
	}

	stripData(chunk: RawChunk): any {
		const d = chunk as any;
	
		if (typeof d.data !== "undefined") {
			delete d.data;
		}
	
		if (typeof d.children !== "undefined") {
			d.children = (d.children as RawChunk[]).map(c => this.stripData(c));
		}
		return chunk;
	}
	
	/**
	 * Searches a RawChunk for all child chunks matching the supplied type.
	 * It searches all children recursively.
	 * 
	 * Items are returned in the order they're found, this should be alright for most cases.
	 * @param chunk Chunk to search
	 * @param type Type of chunk to find
	 * @returns Array of matching chunks
	 */
	searchChunk<T = any>(chunk: RawChunk, type: ChunkTypes): RawChunk<T>[] {
		const matching: RawChunk[] = [];

		if (chunk.type === type) {
			matching.push(chunk);
		}

		if (chunk.children) {
			for (let child of chunk.children) {
				if (child.type === type) {
					matching.push(child);
				}
				if (child.children) {
					for (let nestedChild of child.children) {
						const matches = this.searchChunk(nestedChild, type);
						for (let match of matches) {
							matching.push(match);
						}
					}
				}
			}
		}

		return matching;
	}

	getGeometry(): Geometry[] {
		const geometryList: Geometry[] = [];

		const frames = this.searchChunk<{ name: string }>(this.parsed, ChunkTypes.Frame);
		const geometry = this.searchChunk<GeometryChunk>(this.parsed, ChunkTypes.Geometry);

		const atomics = this.searchChunk<AtomicChunk>(this.parsed, ChunkTypes.Atomic);
		console.log(`Found ${atomics.length} atomic`);

		for (let atomic of atomics) {
			if (!atomic.parsed) {
				continue;
			}

			const targetGeometry = geometry[atomic.parsed.geometryIndex];
			const targetFrame = frames[atomic.parsed.frameIndex];

			const materials = this.searchChunk(targetGeometry, ChunkTypes.Material);
			const geoIndex = geometry.indexOf(targetGeometry);

			let geoName = targetFrame.parsed?.name || "Unknown Geometry";

			if (targetGeometry.parsed) {
				geometryList.push({
					name: geoName,
					...targetGeometry.parsed,
					materials: materials.filter(m => (m.parsed)).map(m => {
						const textures = this.searchChunk(m, ChunkTypes.Texture);
						if (textures.length > 0) {
							return {
								...m.parsed,
								texture: textures.map(m => m.parsed)[0]
							};
						}
						return {
							...m.parsed
						};
					}),
				});
			}
			
		}

		return geometryList;
	}

	/**
	 * Converts the supplied Geometry to a OBJ and its accompanying Material.
	 * @param geometry 
	 */
	toOBJ(geometry: Geometry): { obj: Buffer, mtl: Buffer } {
		let objLines: string[] = [];
		let mtlLines: string[] = [];


		// Quick shit out an OBJ file
		objLines.push(`mtllib ${geometry.name}.mtl`);

		// Write vertexes
		for (const vertex of geometry.vertices) {
			objLines.push(`v ${vertex.x.toFixed(5)} ${vertex.y.toFixed(5)} ${vertex.z.toFixed(5)} 1.0`);
		}

		// Write UVs
		if (geometry.uvs.length > 0) {
			for (const uv of geometry.uvs[0]) {
				objLines.push(`vt ${uv.u} ${1-uv.v} 0`);
			}
		}
		
		// Write normals
		for (const normal of geometry.normals) {
			objLines.push(`vn ${normal.x.toFixed(5)} ${normal.y.toFixed(5)} ${normal.z.toFixed(5)}`);
		}

		// Write faces/triangles
		
		let currentMaterial: Material | null = null;
		let currentMaterialIndex = -1;

		for (const triangle of geometry.triangles) {
			let v1 = 0;
			let v2 = 0;
			let v3 = 0;

			if (geometry.format & GeometryFormat.rpGEOMETRYTRISTRIP) {
				// Triangle Strip
				v1 = triangle.vertex1 + 1;
				v2 = triangle.vertex2 + 1;
				v3 = triangle.vertex3 + 1;

				if (v1 > geometry.vertices.length) {
					//console.log("Triangle %s has invalid v1 of %s / %s", geometry.triangles.indexOf(triangle), v1, geometry.vertices.length);
					continue;
				}
				if (v2 > geometry.vertices.length) {
					//console.log("Triangle %s has invalid v2 of %s / %s", geometry.triangles.indexOf(triangle), v2, geometry.vertices.length);
					continue;
				}
				if (v3 > geometry.vertices.length) {
					//console.log("Triangle %s has invalid v3 of %s / %s", geometry.triangles.indexOf(triangle), v3, geometry.vertices.length);
					continue;
				}

			} else {
				// Triangle List
			}
			

			if (currentMaterialIndex !== triangle.materialId) {
				if (typeof geometry.materials[triangle.materialId] !== "undefined") {
					currentMaterialIndex = triangle.materialId;
					currentMaterial = geometry.materials[currentMaterialIndex];
					objLines.push(`usemtl ${geometry.name}_${currentMaterialIndex}`);
				} else {
					//console.warn("Failed to find material %s", triangle.materialId)
				}
			}

			if (geometry.uvs.length <= 0) {
				objLines.push(`f ${v1}//${v1} ${v2}//${v2} ${v3}//${v3}`);
			} else if (geometry.normals.length >= 0) {
				objLines.push(`f ${v1}/${v1}/${v1} ${v2}/${v2}/${v2} ${v3}/${v3}/${v3}`);
			} else {
				objLines.push(`f ${v1} ${v2} ${v3}`);
			}
		}

		// Kick some material info in for now
		for (let i=0; i<geometry.materials.length; i++) {
			objLines.push(`# ${i} ${geometry.name}_${i}`);
		}

		// Generate our material file

		for (let i=0; i<geometry.materials.length; i++) {
			const material = geometry.materials[i];
			mtlLines.push(`newmtl ${geometry.name}_${i}`);
			
			if (material.isTextured) {
				mtlLines.push(`\tmap_Kd ${material.texture?.textureName}.png`);
			}

			const ambientR = material.color.r / 255;
			const ambientG = material.color.g / 255;
			const ambientB = material.color.b / 255;
			mtlLines.push(`\tKa ${ambientR} ${ambientG} ${ambientB}`);
		}

		return {
			obj: Buffer.from(objLines.join('\r\n')),
			mtl: Buffer.from(mtlLines.join('\r\n')),
		};
	}
}
export default DFFReader;