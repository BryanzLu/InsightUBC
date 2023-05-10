import fs from "fs-extra";
import {InsightDatasetKind, InsightError} from "./IInsightFacade";

export function saveData(data: any[], courses: string[], id: string, kind: InsightDatasetKind, num: number): void {
	let path = `./data/${id}`;
	if (!fs.existsSync(path)) {
		fs.mkdirSync(path);
	}
	path = `./data/${id}/courses`;
	if (!fs.existsSync(path)) {
		fs.mkdirSync(path);
	}
	for (let i = 0; i < data.length; i++) {
		fs.writeFileSync(`data/${id}/${courses[i]}.json`, JSON.stringify(data[i]));
	}
	fs.writeFileSync( `./data/${id}/numSec.json`, num.toString());
	fs.writeFileSync( `./data/${id}/kind.json`, kind.toString());
}

export function loadData(data: any, id: string) {
	const fileNames = fs.readdirSync(`./data/${id}/courses`);
	const dataset: {[key: string]: any} = {};
	for (const file of fileNames){
		const content = fs.readFileSync(`./data/${id}/courses/${file}`, "utf8");
		dataset[file] = content;
	}
	dataset["numRows"] = Number(fs.readFileSync(`./data/${id}/numSec.json`, "utf8"));
	dataset["kind"] = fs.readFileSync(`./data/${id}/kind.json`, "utf8");
	data[id] = dataset;

	return data;
}

export function numSections(data: any): number {
	let num = 0;
	for (let course of data) {
		num += course.length;
	}
	return num;
}
