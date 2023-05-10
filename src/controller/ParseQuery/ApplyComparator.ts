import {Section} from "../Section";
import {fetchData, readFileContents} from "../PerformQuery";
import {InsightError, ResultTooLargeError} from "../IInsightFacade";
import fs from "fs";
export function ApplyComparator(comparator: string, content: any, not: boolean, id: string): any[] {
	if (Object.keys(content).length !== 1) {
		throw new InsightError("Improper comparator argument count");
	}
	let mfields: string[];
	let sfields: string[];
	let kind = fs.readFileSync(`./data/${id}/kind.json`, "utf8");
	if (kind === "rooms") {
		mfields = ["lat", "lon", "seats"];
		sfields = ["fullname", "shortname", "number", "name", "address", "type", "furniture", "href"];
	} else { // sections
		mfields = ["avg", "pass", "fail", "audit", "year"];
		sfields = ["dept", "id", "instructor", "title", "uuid"];
	}
	for (let field of mfields) {
		let idString = id.concat("_", field);
		if (content[idString] !== undefined) {
			if (typeof content[idString] !== "number") {
				throw new InsightError("Invalid mField input type");
			}
			return fetchData(readFileContents(id), comparator, field, content[idString], not);
		}
	}
	for (let field of sfields) {
		let idString = id.concat("_", field);
		if (content[idString] !== undefined) {
			if (typeof content[idString] !== "string") {
				throw new InsightError("Invalid sField input type");
			}
			let value = content[idString];
			if (value.startsWith("*")) {
				value = value.substring(1);
			}
			if (value.endsWith("*")) {
				value = value.substring(0, value.length - 1);
			}
			if (value.includes("*")) {
				throw new InsightError("Invalid input string");
			}
			return fetchData(readFileContents(id), comparator, field, content[idString], not);
		}
	}
	throw new InsightError("Bad Comparator");
}
