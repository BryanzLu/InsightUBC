import JSZip from "jszip";
import {Section} from "./Section";
import {InsightDatasetKind, InsightError} from "./IInsightFacade";
import {Building} from "./Building";
import {Room} from "./Room";
import {parse} from "parse5";
import * as http from "http";


export async function getContent(id: string, content: string, kind: InsightDatasetKind): Promise<any[]>{
	let result;
	if (kind === InsightDatasetKind.Sections) {
		result = getContentCourses(id, content);
	} else {
		result = getContentRooms(id, content);
	}
	return result;
}

async function getContentCourses(id: string, content: string): Promise<any[]>{
	try {
		const zip = new JSZip();
		const zipFile = await zip.loadAsync(content, {base64: true}); // parse content as base64

		let sections = Object.keys(zipFile.files); // get all the files in the zip

		let fileContent = await Promise.all(sections.map(async (section) => {  // extract the content of each file as string
			return zipFile.files[section].async("string");
		}
		));

		if (sections[0] !== "courses/") {
			return Promise.reject(new InsightError("invalid content sections1"));   // ensure init directory is courses/
		}
		fileContent.shift();
		const sectionJSON = [];
		for (let file of fileContent.values()) {
			sectionJSON.push(JSON.parse(file));
		}

		sections.shift();
		return [sectionJSON, sections];
	} catch(err) {
		return Promise.reject(err);
	}
}

export function parseSection(data: any[]): any {
	// let section: Section[] = [];
	const courseSections = [];

	for (let file of data) {
		const courseSection = file.result; // get section
		const sections: Section[] = [];
		for (const sec of courseSection){
			if (validSection(sec)) {
				let year = parseInt(sec.Year, 10);  // added this!
				if (sec.Section === "overall") {
					year = 1900;
				}
				const section: Section = new Section(    // create a new section
					sec.id,
					sec.Course,
					sec.Title,
					sec.Professor,
					sec.Subject,
					year,
					sec.Avg,
					sec.Pass,
					sec.Fail,
					sec.Audit
				);
				sections.push(section);
			}
		}
		if (sections.length !== 0) {
			courseSections.push(sections);
		}
	}
	return courseSections;

}

async function getContentRooms(id: string, content: string): Promise<any[]> {
	let zip = new JSZip();
	let zipFile = await zip.loadAsync(content, {base64: true});

	try {
		let buildings = await readRoomsFile(zipFile);
		return [buildings, content];
	} catch (err) {
		return Promise.reject(new InsightError("invalid content rooms"));
	}
}


function readRoomsFile(zipFile: any): Promise<Building[]> {
	let buildings: Building[] = [];
	try {
		return zipFile.file("index.htm").async("text").then(function (fileInfo: any) {
			let indexObj = parse(fileInfo);
			return indexObj;
		}).then(async function (indexObj: any) {
			await getBuildings(indexObj, buildings);
		}).then (() => {
			return Promise.resolve(buildings);
		});
	} catch(err) {
		return Promise.reject(new InsightError("BAD buildings file read"));
	}
}


async function getBuildings(indexObj: any, buildings: Building[]) {
	if (Object.keys(indexObj).includes("attrs") && Object.keys(indexObj).includes("tagName")) {
		if (indexObj.tagName === "tr" && indexObj.attrs[0]) {
			buildings.push(await makeBuilding(indexObj));
		}
	}
	if (Object.keys(indexObj).includes("childNodes")) {
		let promises = [];
		for (let child of indexObj.childNodes) {
			promises.push(getBuildings(child, buildings));
		}
		await Promise.all(promises);
	}
}

function makeBuilding(indexObj: any): Promise<Building> {
	let fullName = indexObj.childNodes[5].childNodes[1].childNodes[0].value.trim();
	let shortName = indexObj.childNodes[3].childNodes[0].value.trim();
	let address = indexObj.childNodes[7].childNodes[0].value.trim();
	let path = indexObj.childNodes[5].childNodes[1].attrs[0].value.substring(1).trim();

	return getLatLon(address).then((result) => {
		let lat = result[0];
		let lon = result[1];
		// console.log(shortName + " " + address + " " + lat)
		return new Building(fullName, shortName, address, path, lat, lon);
	});
}

export function getLatLon(address: string): Promise<[number, number]> {
	let urlAddress = encodeURI(address);
	let query = `http://cs310.students.cs.ubc.ca:11316/api/v1/project_team110/${urlAddress}`;
	let latitude = 404;
	let longitude = 404;

	return new Promise((resolve, reject) => {
		http.get(query, (result: any) => {
			let data = "";
			result.on("data", (chunk: any) => {
				data += chunk;
			}).on("end", () => {
				try {
					let parsedAddress = JSON.parse(data);
					latitude = parsedAddress.lat;
					longitude = parsedAddress.lon;
					// console.log(latitude + " " + longitude)
					return resolve([latitude, longitude]);
				} catch (err) {
					return resolve([404, 404]);
				}
			});
		}).on("error", () => {
			return resolve([404, 404]);
		});
	});

}

export async function parseBuilding(buildings: Building[], content: any): Promise<Room[]> {
	let zip = new JSZip();
	let zipFile = await zip.loadAsync(content, {base64: true});

	return parseBuildingHelper(zipFile, buildings);
}

async function parseBuildingHelper(zipFile: any, buildings: Building[]): Promise<Room[]> {
	let rooms: Room[] = [];
	let promises = [];
	for (let building of buildings) {
		promises.push(getRoomFile(building.getPath(), zipFile, rooms, building));
	}
	await Promise.all(promises);
	return rooms;
}

function getRoomFile(path: string, zipFile: any, rooms: Room[], buildingObj: Building): Room[] {
	try {
		return zipFile.file(path.substring(1)).async("text").then(function (buildingHtml: any) {
			let building = parse(buildingHtml);
			return building;
		}).then(async function (building: any) {
			await getRooms(building, rooms, buildingObj);
		}).then(() => {
			return rooms;
		});
	}catch (err) {
		return rooms;
	}
}

async function getRooms(building: any, rooms: Room[], buildingObj: Building) {
	if (Object.keys(building).includes("childNodes") && Object.keys(building).includes("tagName")) {
		if (building.childNodes[1] && Object.keys(building.childNodes[1]).includes("tagName")) {
			if (building.childNodes[1].tagName === "td" && building.tagName === "tr") {
				try{
					let room = makeRoom(building, buildingObj);

					if (room.getLat() === 404 && room.getLon() === 404){
						await getLatLon(room.getAddress()).then((result: any) => {
							// console.log(result)
							room.setLat(result[0]);
							room.setLon(result[1]);
							if (room.getLat() !== 404 && room.getLon() !== 404) {
								rooms.push(room);
							}
						});
					} else {
						rooms.push(room);
					}
				} catch(err) {
					// if make room fails, just skip it
				}
			}
		}
	}

	if (Object.keys(building).includes("childNodes")) {
		for (let child of building.childNodes) {
			getRooms(child, rooms, buildingObj);
		}
	}
}

function makeRoom(building: any, buildingObj: Building): Room {
	let fullName: string = buildingObj.getFullName();
	let shortName: string = buildingObj.getShortName();
	let number: string = building.childNodes[1].childNodes[1].childNodes[0].value;
	let name: string = shortName + "_" + number;
	let address: string = buildingObj.getAddress();
	let lat: number = buildingObj.getLat();
	let lon: number = buildingObj.getLon();
	let type: string = building.childNodes[7].childNodes[0].value.trim();
	let furniture: string = building.childNodes[5].childNodes[0].value.trim();
	let href: string = building.childNodes[1].childNodes[1].attrs[0].value;
	let seats;

	if (building.childNodes[3].childNodes[0].value.trim()) {
		seats = parseInt(building.childNodes[3].childNodes[0].value.trim(), 10);
	} else {
		seats = 0;
	}
	return new Room(fullName, shortName, number, name, address, lat, lon, seats, type, furniture, href);
}

export function isIdInvalid(id: string): boolean {
	return (id === " " || id.includes("_") || !id || id === null);
}

function validSection(data: any) {
	return (
		Object.prototype.hasOwnProperty.call(data, "id") &&
		Object.prototype.hasOwnProperty.call(data, "Course") &&
		Object.prototype.hasOwnProperty.call(data, "Professor") &&
		Object.prototype.hasOwnProperty.call(data, "Title") &&
		Object.prototype.hasOwnProperty.call(data, "Subject") &&
		Object.prototype.hasOwnProperty.call(data, "Year") &&
		Object.prototype.hasOwnProperty.call(data, "Avg") &&
		Object.prototype.hasOwnProperty.call(data, "Pass") &&
		Object.prototype.hasOwnProperty.call(data, "Fail") &&
		Object.prototype.hasOwnProperty.call(data, "Audit")
	);
}
