
					// // Quick shit out an OBJ file
					// const objFile: string[] = [];

					// objFile.push(`mtllib ${numTriangles}.mtl`);

					// // Write vertexes
					// for (const vertex of vertices) {
					// 	objFile.push(`v ${vertex.x.toFixed(5)} ${vertex.y.toFixed(5)} ${vertex.z.toFixed(5)} 1.0`);
					// }

					// // Write UVs
					// for (const uv of uvs) {
					// 	objFile.push(`vt ${uv.u} ${1-uv.v} 0`);
					// }
					
					// // Write normals
					// for (const normal of normals) {
					// 	objFile.push(`vn ${normal.x.toFixed(5)} ${normal.y.toFixed(5)} ${normal.z.toFixed(5)}`);
					// }

					// // Write faces/triangles
					
					// let currentMaterial: { textureName: string } | null = null;
					// let currentMaterialIndex = -1;

					// for (const triangle of triangles) {
					// 	const v1 = triangle.vertex1 + 1;
					// 	const v2 = triangle.vertex2 + 1;
					// 	const v3 = triangle.vertex3 + 1;

					// 	if (v1 > vertices.length) {
					// 		//console.log("Triangle %s has invalid v1 of %s / %s", triangles.indexOf(triangle), v1, vertices.length);
					// 		continue;
					// 	}
					// 	if (v2 > vertices.length) {
					// 		//console.log("Triangle %s has invalid v2 of %s / %s", triangles.indexOf(triangle), v2, vertices.length);
					// 		continue;
					// 	}
					// 	if (v3 > vertices.length) {
					// 		//console.log("Triangle %s has invalid v3 of %s / %s", triangles.indexOf(triangle), v3, vertices.length);
					// 		continue;
					// 	}

					// 	if (currentMaterialIndex !== triangle.materialId) {
					// 		if (typeof materialList[triangle.materialId] !== "undefined") {
					// 			currentMaterialIndex = triangle.materialId;
					// 			currentMaterial = materialList[currentMaterialIndex];
					// 			objFile.push(`usemtl ${currentMaterial.textureName}`);
					// 		} else {
					// 			console.warn("Failed to find material %s", triangle.materialId)
					// 		}
					// 	}

					// 	if (uvs.length <= 0) {
					// 		objFile.push(`f ${v1}//${v1} ${v2}//${v2} ${v3}//${v3}`);
					// 	} else if (normals.length >= 0) {
					// 		objFile.push(`f ${v1}/${v1}/${v1} ${v2}/${v2}/${v2} ${v3}/${v3}/${v3}`);
					// 	} else {
					// 		objFile.push(`f ${v1} ${v2} ${v3}`);
					// 	}
					// }

					// // Kick some material info in for now
					// for (let i=0; i<materialList.length; i++) {
					// 	objFile.push(`# ${i} ${materialList[i].textureName}`);
					// }


					// fs.writeFileSync(path.join(__dirname, "..", "obj", `${numTriangles}.obj`), objFile.join('\r\n'));

					// // Generate our material file
					// const mtlFile: string[] = [];

					// for (let mat of materialList) {
					// 	mtlFile.push(`newmtl ${mat.textureName}`);
					// 	mtlFile.push(`map_Kd ${mat.textureName}.png`);
					// }

					// fs.writeFileSync(path.join(__dirname, "..", "obj", `${numTriangles}.mtl`), mtlFile.join('\r\n'));
