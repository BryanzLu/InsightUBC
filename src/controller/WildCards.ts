import * as fs from "fs";
import {InsightError} from "./IInsightFacade";
import {Section} from "./Section";

export function getValue(value: string, wildCards: string): string {
	switch(wildCards) {
		case "both":
			value = value.substring(1, value.length - 1);
			break;
		case "start":
			value = value.substring(1, value.length);
			break;
		case "end":
			value = value.substring(0, value.length - 1);
			break;
	}
	return value;
}

export function getWildCards(str: string): string {
	let length = str.length;

	let result;
	if (str.charAt(0) === "*") {
		result = "start";
		if (str.charAt(length - 1) === "*") {
			result = "both";
		}
	} else {
		if (str.charAt(length - 1) === "*") {
			result = "end";
		} else {
			for (let i = 1; i < str.length - 1; i++) {
				if (str.charAt(i) === "*") {
					throw new InsightError("Invalid input string");
				}
			}
			result = "none";
		}
	}
	return result;
}


export function getWildCardResult(str: string, position: string, field: string): boolean {
	switch (position) {
		case "start":
			return field.endsWith(str);
		case "both":
			return field.endsWith(str) || field.startsWith(str);
		case "end":
			return field.startsWith(str);
		default:
			return field === str;
	}

}
