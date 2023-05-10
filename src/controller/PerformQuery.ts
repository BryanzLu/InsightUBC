import * as fs from "fs";
import {InsightError, ResultTooLargeError} from "./IInsightFacade";
import {Section} from "./Section";
import {getValue, getWildCardResult, getWildCards} from "./WildCards";

export function readFileContents(id: string): any[] {
	try {
		let kind = fs.readFileSync(`./data/${id}/kind.json`, "utf8");
		if (kind === "rooms") { // bryan
			return readFileContentsRoom(id);
		}
		let courses = fs.readdirSync(`./data/${id}/courses`);
		let dataset: Section[] = [];
		for (let  course of courses) {
			let courseSections = fs.readFileSync(`./data/${id}/courses/${course}`, "utf8");
			let courseSectionsObj = JSON.parse(courseSections);
			for (let section of courseSectionsObj) {
				let sectionObj: Section = JSON.parse(JSON.stringify(section));
				dataset.push(sectionObj);
			}
		}
		return dataset; // returns an array of section objects
	} catch (err){
		throw new InsightError("Cannot find dataset ID");
	}
};
function readFileContentsRoom(id: string): any[] {
	let rooms = fs.readdirSync(`./data/${id}/rooms`);
	let dataset: Section[] = [];
	for (let room of rooms) {
		let roomJson = fs.readFileSync(`./data/${id}/rooms/${room}`, "utf8");
		let roomObj = JSON.parse(roomJson);
		dataset.push(roomObj);
	}
	return dataset; // returns an array of room objects
}
// returns list of sections that pass through the filter, comparator = LT, GT, EQ, or IS, value is passed into comparison
export function fetchData(data: any[], comparator: string,
						  field: string, value: any, not: boolean): any[] {
	let results: any[] = [];
	if (comparator === "EQ") {
		if (not) {
			results = getGTResult(data, field, value).concat(getLTResult(data, field, value));
		} else {
			results = getEQResult(data, field, value);
		}
	} else if (comparator === "GT") {
		if (not) {
			results = getEQResult(data, field, value).concat(getLTResult(data, field, value));
		} else {
			results = getGTResult(data, field, value);
		}
	} else if (comparator === "LT") {
		if (not) {
			results = getGTResult(data, field, value).concat(getEQResult(data, field, value));
		} else {
			results = getLTResult(data, field, value);
		}
	} else if (comparator === "IS") {
		if (not) {
			results = getISNOTResult(data, field, value);
		} else {
			results = getISResult(data, field, value);
			// console.log(results);
		}
	} else {
		throw new InsightError("Query invalid");
	}
	return results;
};
function getEQResult(data: any[], field: string, value: any): any[] {
	let results: any[] = [];
	for (let i of data) {
		if (i[field] !== undefined) {
			if (i[field] === value) {
				results.push(i);
			}
		} else {
			throw new InsightError("Bad EQ field input");
		}
	}
	return results;
}

function getGTResult(data: any[], field: string, value: any): any[]  {
	let results: any[] = [];
	for (let i of data) {
		if (i[field] !== undefined) {
			if (i[field] > value) {
				results.push(i);
			}
		} else {
			throw new InsightError("Bad GT field input");
		}
	}
	// console.log(results);
	return results;
}
function getLTResult(data: any[], field: string, value: any): any[] {
	let results: any[] = [];
	for (let i of data) {
		if (i[field] !== undefined) {
			if (i[field] < value) {
				results.push(i);
			}
		} else {
			throw new InsightError("Bad LT field input");
		}
	}
	return results;
}
function getISResult(sections: any[], field: string, value: any): any[] {
	let results: any[] = [];
	let wildCards = getWildCards(value);
	if (value.length === 1 && value.charAt(0) === "*") {
		return sections;
	}
	value = getValue(value, wildCards);
	for (let i of sections) {
		if (i[field] !== undefined) {
			if (getWildCardResult(value, wildCards, i[field])) {
				results.push(i);
			}
		} else {
			throw new InsightError("Bad IS field input");
		}
	}
	return results;
}
function getISNOTResult(sections: any[], field: string, value: any): any[] {
	let results: any[] = [];
	let wildCards = getWildCards(value);
	if (value.length === 1 && value.charAt(0) === "*") {
		return sections;
	}
	value = getValue(value, wildCards);
	for (let i of sections) {
		if (i[field] !== undefined) {
			if (!getWildCardResult(value, wildCards, i[field])) {
				results.push(i);
			}
		} else {
			throw new InsightError("Bad IS field input");
		}
	}
	return results;
}
