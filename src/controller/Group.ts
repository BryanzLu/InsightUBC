import Decimal from "decimal.js";

export class Group {
	private keyValues: any[];
	private members: any[];
	constructor(keyValues: any[], members: any[]) {
		this.keyValues = keyValues;
		this.members = members;
	}

	public addMember(member: any) {
		this.members.push(member);
	}

	public getKeyValues() {
		return this.keyValues;
	}

	public getMembers() {
		return this.members;
	}

	public applyRule(rule: string, field: string) {
		field = field.split("_")[1];
		let result = 0;
		let total = new Decimal(0);
		let uniques: any[] = [];
		if (rule === "MAX" || rule === "MIN") {
			result = this.members[0][field];
		}
		for (let member of this.members) {
			let val = member[field];
			if (rule === "MAX") {
				if (val > result) {
					result = val;
				}
			} else if (rule === "MIN") {
				if (val < result) {
					result = val;
				}
			} else if (rule === "AVG" ) {  // || rule === "SUM"
				let num = new Decimal(val);
				// result += val;
				total = Decimal.add(num, total);
			} else if (rule === "SUM") {

				result += val;


			} else {
				if (!uniques.includes(val)) {
					uniques.push(val);
				}
			}
		}
		if (rule === "AVG") {
			// result /= this.members.length;
			// result = parseFloat(result.toFixed(2));
			let avg = total.toNumber() / this.members.length;
			result = Number(avg.toFixed(2));
		} else if (rule === "SUM") {
			result = Number(result.toFixed(2));
		} else if (rule === "COUNT") {
			result = uniques.length;
		} else if (rule === "MIN") {
			// console.log(result);
		}
		return result;
	}
}
