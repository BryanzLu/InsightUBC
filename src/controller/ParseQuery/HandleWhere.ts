import {ApplyComparator} from "./ApplyComparator";
import {ApplyLogic} from "./ApplyLogic";
import {Section} from "../Section";
import {readFileContents} from "../PerformQuery";
import {InsightError} from "../IInsightFacade";
export function HandleWhere(where: any, not: boolean, id: string): any[] {
	if (where.OR !== undefined) {
		return ApplyLogic("OR", where.OR, not, id);
	} else if (where.AND !== undefined) {
		return ApplyLogic("AND", where.AND, not, id);
	} else if (where.EQ !== undefined) {
		return ApplyComparator("EQ", where.EQ, not, id);
	} else if (where.GT !== undefined) {
		return ApplyComparator("GT", where.GT, not, id);
	} else if (where.LT !== undefined) {
		return ApplyComparator("LT", where.LT, not, id);
	} else if (where.IS !== undefined) {
		return ApplyComparator("IS", where.IS, not, id);
	} else if (where.NOT !== undefined) {
		if (JSON.stringify(where.NOT) === "{}") {
			throw new InsightError("Empty NOT");
		}
		return HandleWhere(where.NOT, !not, id);
	} else if (JSON.stringify(where) === "{}") {
		return readFileContents(id);
	} else {
		throw new InsightError("Invalid Where");
	}
}

