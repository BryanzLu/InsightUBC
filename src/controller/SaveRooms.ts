import {InsightDatasetKind, InsightError} from "./IInsightFacade";
import fs from "fs-extra";
import {Room} from "./Room";

export function saveRoomsData(data: Room[], content: string, id: string, kind: InsightDatasetKind, num: number): void {
	let path = `./data/${id}`;
	if (!fs.existsSync(path)) {
		fs.mkdirSync(path);
	}
	path = `./data/${id}/rooms`;
	if (!fs.existsSync(path)) {
		fs.mkdirSync(path);
	}
	for (let room of data) {
		let name = room.getName();
		fs.writeFileSync(`data/${id}/rooms/${name}.json`, JSON.stringify(room));
	}
	fs.writeFileSync( `./data/${id}/numRooms.json`, num.toString());
	fs.writeFileSync( `./data/${id}/kind.json`, kind.toString());
}

export function loadRoomsData(data: any, id: string) {
	const fileNames = fs.readdirSync(`./data/${id}/rooms`);
	const dataset: {[key: string]: any} = {};
	for (const file of fileNames){
		const content = fs.readFileSync(`./data/${id}/rooms/${file}`, "utf8");
		dataset[file] = content;
	}
	dataset["numRows"] = Number(fs.readFileSync(`./data/${id}/numRooms.json`, "utf8"));
	dataset["kind"] = fs.readFileSync(`./data/${id}/kind.json`, "utf8");
	data[id] = dataset;

	return data;
}

export function numRooms(data: any): number {
	return data.length;
}
