

import {InsightError, InsightResult, ResultTooLargeError} from "../IInsightFacade";
import {Section} from "../Section";
import fs from "fs";

export function HandleOptionsCheck(options: any, validColumns: string[]): string[] {
	if (options.COLUMNS !== undefined) {
		let id: string[];
		let cols = options.COLUMNS;
		if (validColumns[0] !== "___") {
			for (let anyKey of cols) {
				if (!validColumns.includes(anyKey, 1)) {
					throw new InsightError("Column not an applykey or group key");
				}
			}
		}
		id = [checkKeyList(cols)];
		if (options.ORDER !== undefined) {
			let order = options.ORDER;
			checkOrder(order, cols);
		}
		return id;
	} else {
		throw new InsightError("No columns");
	}
}

export function HandleOptions(options: any, data: any[]) {
	let cols = options.COLUMNS;
	let results = filterResults(cols, data);
	if (options.ORDER !== undefined) {
		let order = options.ORDER;
		if (options.ORDER.dir !== undefined) {
			let dir = options.ORDER.dir;
			let keys = options.ORDER.keys;
			if (dir === "UP") {
				return orderResultsUp(keys, results);
			} else {
				return orderResultsDown(keys, results);
			}
		} else {
			let orderedResults = orderResultsUp([order], results);
			return orderedResults;
		}
	}
	return results;
}
export function checkKeyList(cols: string[]): string {
	if (cols.length === 0) {
		throw new InsightError("Empty COLUMNS/GROUPS");
	}
	for (let item of cols) {
		if (item.length < 1) {
			throw new InsightError("idstring length 0");
		}
		let count = 0;
		for (let i = 0; i < item.length; i++) {
			if (item.charAt(i) === "_") {
				count++;
			}
		}
		if (count > 1) {
			throw new InsightError("improper idstring");
		}
	}
	let id;
	for (let item of cols) {
		if (item.includes("_")) {
			id = item.split("_")[0];
			break;
		}
	}
	if (typeof id === "undefined") {
		id = "filler";
	}
	for (let item of cols) {
		if (item.includes("_")) {
			if (item.split("_")[0] !== id) {
				throw new InsightError("id strings dont match");
			}
			fieldCheckInvalid(item.split("_")[1], id);
		}
	}
	return id;
}
function checkOrder(order: any, cols: string[]) {
	if (order.dir !== undefined) {
		let dir = order.dir;
		if (dir !== "UP" && dir !== "DOWN") {
			throw new InsightError("Invalid order direction");
		}
		if (order.keys !== undefined) {
			let keys = order.keys;
			for (let key of keys) {
				let valid = false;
				for (let col of cols) {
					if (col === key) {
						valid = true;
						break;
					}
				}
				if (valid === false) {
					throw new InsightError("order key not in columns");
				}
			}
		} else {
			throw new InsightError("dir but no keys in order");
		}
	} else {
		for (let col of cols) {
			if (col === order) {
				return;
			}
		}
		throw new InsightError("order key not in columns");
	}
}
export function fieldCheckInvalid(field: string, id: string) {
	let fields: string[];
	if (fs.readFileSync(`./data/${id}/kind.json`, "utf8") === "rooms") {
		fields = ["fullname", "shortname", "number", "name", "address", "lat",
			"lon", "seats", "type", "furniture", "href"];
	} else {
		fields = ["avg", "pass", "fail", "audit", "year", "dept", "id", "instructor", "title", "uuid"];
	}
	for (let item of fields) {
		if (field === item) {
			return;
		}
	}
	throw new InsightError("Invalid field");
}
function filterResults(anyKeys: string[], data: any[]) {
	try {
		let result: InsightResult[] = [];

		for (let entry of data) {
			let insightResult: InsightResult = {};
			for (let anyKey of anyKeys) {
				insightResult[anyKey] = entry[anyKey];
			}
			result.push(insightResult);
		}
		return result;
	} catch (err) {
		throw new InsightError("Trouble filtering query results");
	}
}

/* function getSectionInfo(data: any, key: string): any {
	switch (field) {
		case("uuid"):
			return section["uuid"].toString();
		case ("id"):
			return section["id"].toString();
		case("title"):
			return section["title"].toString();
		case("instructor"):
			return section["instructor"].toString();
		case("dept"):
			return section["dept"].toString();
		case("year"):
			return section["year"];
		case("avg"):
			return section["avg"];
		case("pass"):
			return section["pass"];
		case("fail"):
			return section["fail"];
		case("audit"):
			return section["audit"];
		default:
			throw new InsightError("Error with get section info");
	}
}
 */
function orderResultsUp(keys: string[], results: InsightResult[]) {
	let sorted;
	for (let i = 0; i < keys.length; i++) {
		if (keys[i].includes("_")) {
			keys[i] = keys[i].split("_")[1];
		}
	}
	sorted = results.sort(function(a, b) {
		for (let key of keys) {
			if (a[key] === b[key]) {
				continue;
			} else if (a[key] < b[key]) {
				return -1;
			} else {
				return 1;
			}
		}
		return 0;
	});
	return sorted;
}
function orderResultsDown(keys: string[], results: InsightResult[]) {
	let sorted;
	for (let i = 0; i < keys.length; i++) {
		if (keys[i].includes("_")) {
			keys[i] = keys[i].split("_")[1];
		}
	}
	sorted = results.sort(function(a, b) {
		for (let key of keys) {
			if (a[key] === b[key]) {
				continue;
			} else if (a[key] < b[key]) {
				return 1;
			} else {
				return -1;
			}
		}
		return 0;
	});
	return sorted;
}
/* export function HandleOptionsCheck(options: string): string {
	try {
		let next = options.split("\"],\"ORDER\":\"");
		if (options === next[0]) {
			next[0] = options.substring(0, options.length - 3);
		}
		let filler = new Section("","","","","",0,0,0,0,0);
		let columns = next[0].split("\",\"");
		let colIds: string[] = new Array(columns.length);
		let colFields: string[] = new Array(columns.length);
		for (let i = 0; i < columns.length; i++) {
			let temp = columns[i].split("_");
			colIds[i] = temp[0];
			colFields[i] = temp[1];
		}
		if (options.substring(0, options.length - 3) !== next[0]) {
			let order = next[1].substring(0, next[1].length - 2);
			let orderId = order.split("_")[0];
			let orderField = order.split("_")[1];
			getSectionInfo(filler, orderField);
			if (colIds[0] !== orderId) {
				throw new InsightError("keys not the same");
			}
			let orderFieldCheck = false;
			for (let item of colFields) {
				if (orderField === item) {
					orderFieldCheck = true;
				}
			}
			if (!orderFieldCheck) {
				throw new InsightError("order field not in column fields");
			}
		}
		for (let item of colFields) {
			getSectionInfo(filler, item);
		}
		for (let item of colIds) {
			if (colIds[0] !== item) {
				throw new InsightError("keys not the same");
			}
		}
		return colIds[0];
	} catch (err) {
		if (err === ResultTooLargeError) {
			throw new ResultTooLargeError("Query too large");
		} else {
			throw new InsightError("Perform query bad options check");
		}
	}
}
 */
