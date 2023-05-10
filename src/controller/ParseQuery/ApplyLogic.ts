import {HandleWhere} from "./HandleWhere";
import {Section} from "../Section";
import {InsightError, ResultTooLargeError} from "../IInsightFacade";
export function ApplyLogic(logic: string, content: any, not: boolean, id: string): any[] {
	if (content.length > 0) {
		let final: Section[] = HandleWhere(content[0], not, id);
		if (content.length > 1) {
			if (not) {
				if (logic === "AND") {
					logic = "OR";
				} else {
					logic = "AND";
				}
			}
			if (logic === "AND") {
				for (let i = 1; i < content.length; i++) {
					let cmp = HandleWhere(content[i], not, id);
					final = final.filter(
						function(x) {
							return findObject(x, cmp);
						}
					);
				}
				// do below but not
				// return a list containing the common elements of the lists returned
				// by calling HandleWhere on each index of args
			} else {
				// console.log("entering OR loop")
				for (let i = 1; i < content.length; i++) {
					// console.log(args[i])
					let cmp = HandleWhere(content[i], not, id);
					for (const item of cmp) {
						if (!findObject(item, final)) {
							final.push(item);
						}
					}
				}
				// return a list containing all the elements of every list returned by
				// calling HandleWhere on each index of args
			}
		}
		return final;
	} else {
		throw new InsightError("Empty logic");
	}
}

function findObject(toFind: any, toSearch: any[]): boolean {
	try {
		for (const i of toSearch) {
			if (compareObject(toFind, i)) {
				return true;
			}
		}
		return false;
	} catch(err) {
		throw new InsightError("error w/ find section");
	}

}

function compareObject(one: any, two: any): boolean {
	try {
		let oneKeys = Object.keys(one);
		let twoKeys = Object.keys(two);
		if (oneKeys.length !== twoKeys.length) {
			throw new InsightError();
		}
		for (let i = 0; i < oneKeys.length; i++) {
			if (oneKeys[i] !== twoKeys[i]) {
				throw new InsightError();
			}
		}
		for (let key of oneKeys) {
			if (one[key] !== two[key]) {
				return false;
			}
		}
		return true;
	} catch (err) {
		throw new InsightError("error w/ compare section");
	}
}
