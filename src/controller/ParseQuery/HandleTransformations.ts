import {InsightError, InsightResult} from "../IInsightFacade";
import {checkKeyList, fieldCheckInvalid} from "./HandleOptions";
import {Group} from "../Group";

export function TransformationsCheck(transformations: any) {
	if (transformations.GROUP !== undefined) {
		if (transformations.APPLY !== undefined) {
			let group = transformations.GROUP;
			let apply = transformations.APPLY;
			let id: string[] = [checkKeyList(group)];
			for (let i of group) {
				id.push(i);
			}
			if (JSON.stringify(apply) !== "[]") {
				let ruleKeys: string[] = [];
				for (let applyRule of apply) {
					let applyKey = Object.keys(applyRule)[0];
					if (applyKey.length < 1) {
						throw new InsightError("applykey has zero characters");
					}
					if (applyKey.includes("_")) {
						throw new InsightError("applykey has _");
					}
					if (id.includes(applyKey)) {
						throw new InsightError("duplicate apply key");
					}
					id.push(applyKey);
					let applyToken = findToken(applyRule[applyKey]);
					let ruleKey = applyRule[applyKey][applyToken];
					if (applyToken !== "COUNT") {
						let temp = ruleKey;
						let sfields = ["fullname", "shortname", "number", "name", "address", "type",
							"furniture", "href", "dept", "id", "instructor", "title", "uuid"];
						if (ruleKey.includes("_")) {
							temp = ruleKey.split("_")[1];
						}
						if (sfields.includes(temp)) {
							throw new InsightError("Invalid field for apply token");
						}
					}
					ruleKeys.push(ruleKey);
				}
				checkKeyList(ruleKeys);
			}
			return id;
		}
	}
	throw new InsightError("No GROUP/APPLY inside transformations");
}

export function HandleTransformations(transformations: any, data: any[]): InsightResult[] {
	let groups = transformations.GROUP;
	let apply = transformations.APPLY;
	let groupResult: Group[] = [];
	for (let entry of data) {
		let inGroup = false;
		let keyValues: any[] = [];
		for (let key of groups) {
			key = key.split("_")[1];
			keyValues.push(entry[key]);
		}
		for (let group of groupResult) {
			if (sameKeyValues(keyValues, group.getKeyValues())) {
				if (!group.getMembers().includes(entry)) {
					group.addMember(entry);
				}
				inGroup = true;
				break;
			}
		}
		if (!inGroup) {
			groupResult.push(new Group(keyValues, [entry]));
		}
	}
	let results: InsightResult[] = [];
	for (let group of groupResult) {
		let result: InsightResult = {};
		let keyValues = group.getKeyValues();
		for (let i = 0; i < groups.length; i++) {
			result[groups[i]] = keyValues[i];
		}
		if (JSON.stringify(apply) !== "[]") {
			for (let applyRule of apply) {
				let applyKey = Object.keys(applyRule)[0];
				let rule = findToken(applyRule[applyKey]);
				let field = applyRule[applyKey][rule];
				result[applyKey] = group.applyRule(rule, field);
			}
		}
		results.push(result);
	}
	return results;
}

function findToken (rule: any) {
	let tokens = ["MAX", "MIN", "AVG", "COUNT", "SUM"];
	for (let token of tokens) {
		if (rule[token] !== undefined) {
			return token;
		}
	}
	throw new InsightError("invalid applytoken");
}

function sameKeyValues (one: any[], two: any[]) {
	for (let i = 0; i < one.length; i++) {
		if (one[i] !== two[i]) {
			return false;
		}
	}
	return true;
}
