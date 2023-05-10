import * as fs from "fs";
import {
	IInsightFacade,
	InsightDataset,
	InsightDatasetKind,
	InsightError,
	InsightResult,
	NotFoundError,
	ResultTooLargeError
} from "./IInsightFacade";
import JSZip from "jszip";
import {parseSection, getContent, isIdInvalid, parseBuilding} from "./DataProcessor";
import {HandleWhere} from "./ParseQuery/HandleWhere";
import {HandleOptions, HandleOptionsCheck} from "./ParseQuery/HandleOptions";
import {Section} from "./Section";
import {HandleTransformations, TransformationsCheck} from "./ParseQuery/HandleTransformations";
import {loadData, numSections, saveData} from "./SaveSections";
import {loadRoomsData, numRooms, saveRoomsData} from "./SaveRooms";
/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {
	private data: {[key: string]: any};
	private ids: string[];

	constructor() {
		console.log("InsightFacadeImpl::init()");

		this.data = {};
		this.ids = [];
	}

	public async addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
		let processedData;

		if (isIdInvalid(id)) {
			throw new InsightError("Invalid ID");
		}

		const path = "./data";
		if (!fs.existsSync(path)) {
			fs.mkdirSync(path);
		}

		const existingData = fs.readdirSync("./data");
		if (existingData.includes(id)) {
			throw new InsightError("dataset id already exists");
		}
		if (kind !== InsightDatasetKind.Sections && kind !== InsightDatasetKind.Rooms) {
			throw new InsightError("kind is not sections or rooms");
		}

		let [dataset, courses] = await getContent(id, content, kind);

		if (kind === InsightDatasetKind.Sections) {
			processedData = parseSection(dataset);
			const nSec = numSections(processedData);
			saveData(processedData, courses, id, kind, nSec);
			this.data = loadData(this.data, id);

		} else if (kind === InsightDatasetKind.Rooms) {
			processedData = await parseBuilding(dataset, content);
			const nSec = numRooms(processedData);
			saveRoomsData(processedData, content, id, kind, nSec);
			this.data = loadRoomsData(this.data, id);
		}

		if (processedData.length === 0) {
			throw new InsightError("empty dataset");
		}

		existingData.push(id);
		return Promise.resolve(existingData);
	}

	public removeDataset(id: string): Promise<string> {
		return new Promise((resolve, reject) => {
			// reject invalid id
			if (isIdInvalid(id)) {
				console.log("in here");
				throw new InsightError("Invalid ID");
			}

			let path = `./data/${id}`;
			if (!fs.existsSync(path) && !Object.keys(this.data).includes(id)) {
				throw new NotFoundError("dataset id doesn't exist");
			}

			fs.rmSync(`./data/${id}`, {recursive: true, force: true});
			delete this.data[id];
			return resolve(id);
		});
	};

	public performQuery(query: unknown): Promise<InsightResult[]> {
		return new Promise((resolve, reject) => {
			try {
				let id;
				let result: InsightResult[] = [];
				let listData: any[];
				let qJson = JSON.parse(JSON.stringify(query));
				if (qJson.TRANSFORMATIONS !== undefined) {
					id = TransformationsCheck(qJson.TRANSFORMATIONS);
					// console.log(id);
				}
				if (qJson.OPTIONS !== undefined) {
					if (typeof id === "undefined") {
						id = HandleOptionsCheck(qJson.OPTIONS, ["___"]);
						// console.log(id);
					} else {
						HandleOptionsCheck(qJson.OPTIONS, id);
						console.log("hellllloooo");
					}
				} else {
					throw new InsightError("No options");
				}
				if (qJson.WHERE !== undefined) {
					listData = HandleWhere(qJson.WHERE, false, id[0]);
					// console.log(listData);
					// console.log('hi');
					if (listData.length > 5000) {
						throw new ResultTooLargeError("Result too large");
					}
					if (qJson.TRANSFORMATIONS !== undefined) {
						result = HandleTransformations(qJson.TRANSFORMATIONS, listData);
						result = HandleOptions(qJson.OPTIONS, result);
					} else {
						result = HandleOptions(qJson.OPTIONS, listData);
						// console.log(qJson.OPTIONS);
						// console.log("hhhh");
						// console.log(result);
					}
					// console.log(resolve(result));
					return resolve(result);
				} else {
					throw new InsightError("No where");
				}
			} catch (err) {
				if (err instanceof InsightError || err instanceof ResultTooLargeError) {
					throw err;

				}
				if (err instanceof ResultTooLargeError) {
					throw err;
				} else {
					console.log(err);

					throw new InsightError("Something failed");
				}
			}
		});
	}

	public listDatasets(): Promise<InsightDataset[]> {
		const datasets: InsightDataset[] = [];
		// const nRows = numSections(this.data);
		// console.log(nRows)
		Object.keys(this.data).forEach((key) => {
			const iDataSet: InsightDataset = {
				id: key,
				kind: this.data[key]["kind"],
				numRows: this.data[key]["numRows"],

			};
			datasets.push(iDataSet);
		});
		return Promise.resolve(datasets);
	}
}
