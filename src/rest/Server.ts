import express, {Application, Request, Response} from "express";
import * as http from "http";
import cors from "cors";
import InsightFacade from "../controller/InsightFacade";
import {InsightDatasetKind, InsightError, NotFoundError} from "../controller/IInsightFacade";

export default class Server {
	private readonly port: number;
	private express: Application;
	private server: http.Server | undefined;
	private static facade: InsightFacade = new InsightFacade();

	constructor(port: number) {
		console.info(`Server::<init>( ${port} )`);
		this.port = port;
		this.express = express();

		this.registerMiddleware();
		this.registerRoutes();

		/** NOTE: you can serve static frontend files in from your express server
		 * by uncommenting the line below. This makes files in ./frontend/public
		 * accessible at http://localhost:<port>/
		 */
		// this.express.use(express.static("./frontend/public"))
	}

	/**
	 * Starts the server. Returns a promise that resolves if success. Promises are used
	 * here because starting the server takes some time and we want to know when it
	 * is done (and if it worked).
	 *
	 * @returns {Promise<void>}
	 */
	public start(): Promise<void> {
		return new Promise((resolve, reject) => {
			console.info("Server::start() - start");
			if (this.server !== undefined) {
				console.error("Server::start() - server already listening");
				reject();
			} else {
				this.server = this.express.listen(this.port, () => {
					console.info(`Server::start() - server listening on port: ${this.port}`);
					resolve();
				}).on("error", (err: Error) => {
					// catches errors in server start
					console.error(`Server::start() - server ERROR: ${err.message}`);
					reject(err);
				});
			}
		});
	}

	/**
	 * Stops the server. Again returns a promise so we know when the connections have
	 * actually been fully closed and the port has been released.
	 *
	 * @returns {Promise<void>}
	 */
	public stop(): Promise<void> {
		console.info("Server::stop()");
		return new Promise((resolve, reject) => {
			if (this.server === undefined) {
				console.error("Server::stop() - ERROR: server not started");
				reject();
			} else {
				this.server.close(() => {
					console.info("Server::stop() - server closed");
					resolve();
				});
			}
		});
	}

	// Registers middleware to parse request before passing them to request handlers
	private registerMiddleware() {
		// JSON parser must be place before raw parser because of wildcard matching done by raw parser below
		this.express.use(express.json());
		this.express.use(express.raw({type: "application/*", limit: "10mb"}));

		// enable cors in request headers to allow cross-origin HTTP requests
		this.express.use(cors());
	}

	// Registers all request handlers to routes
	private registerRoutes() {
		// This is an example endpoint this you can invoke by accessing this URL in your browser:
		// http://localhost:4321/echo/hello
		this.express.get("/echo/:msg", Server.echo);

		// TODO: your other endpoints should go here
		this.express.put("/dataset/:id/:kind", Server.putDataset);
		this.express.delete("/dataset/:id", Server.deleteDataset);
		this.express.post("/query", Server.queryDataset);
		this.express.get("/datasets", Server.getDataset);

	}

	/**
	 * The next two methods handle the echo service.
	 * These are almost certainly not the best place to put these, but are here for your reference.
	 * By updating the Server.echo function pointer above, these methods can be easily moved.
	 */
	private static echo(req: Request, res: Response) {
		try {
			console.log(`Server::echo(..) - params: ${JSON.stringify(req.params)}`);
			const response = Server.performEcho(req.params.msg);
			res.status(200).json({result: response});
		} catch (err) {
			res.status(400).json({error: err});
		}
	}

	private static performEcho(msg: string): string {
		if (typeof msg !== "undefined" && msg !== null) {
			return `${msg}...${msg}`;
		} else {
			return "Message not provided";
		}
	}

	private static putDataset(request: Request, response: Response) {
		try {
			if (!request.body || !request.params.id || !request.params.kind || request.body === "") {
				response.json(400).json({error: "Error w/ putdataset"});
				return response.end();
			}

			let body = request.body;
			let id: string = request.params.id;
			let kindStr = request.params.kind;
			body = body.toString("base64");

			if (kindStr === "sections") {
				Server.facade.addDataset(id, body, InsightDatasetKind.Sections).then(function (arr: any) {
					response.status(200).json({result: arr});
					return response.end();
				}).catch((err) => {
					response.status(400).json({error: "Error with putDataset"});
					return response.end();
				});
			} else if (kindStr === "rooms") {
				Server.facade.addDataset(id, body, InsightDatasetKind.Rooms).then(function (arr: any) {
					response.status(200).json({result: arr});
					return response.end();
				}).catch((err) => {
					response.status(400).json({error: "Error with putDataset"});
					return response.end();
				});
			} else {
				response.status(400).json({error: "kind needs to be sections or rooms"});
				return response.end();
			}
		} catch (err){
			response.status(400).json({error: "Error with putDataset"});
			return response.end();
		}
	}

	private static deleteDataset(request: Request, response: Response) {
		try {
			if (!request.params.id) {
				response.status(400).json({error: "error w/ deleeDataset"});
				return response.end();
			}

			let id = request.params.id;

			Server.facade.removeDataset(id).then(function (str: string) {
				response.status(200).json({result: str});
				return response.end();
			}).catch((err) => {
				if (err instanceof NotFoundError) {
					response.status(404).json({error: "Error with deleteDataset"});
					return response.end();
				} else if (err instanceof InsightError) {
					response.status(400).json({error: "Error with deleteDataset"});
					return response.end();
				}
			});
		} catch(err) {
			response.status(400).json({error: "Error with deleteDataset"});
			return response.end();
		}
	}

	private static queryDataset(request: Request, response: Response) {
		try {
			if (!request.body || request.body === "") {
				response.status(400).send({error: "empty query"});
				return response.end();
			}
			let body = request.body;
			Server.facade.performQuery(body).then(function (arr: any) {
				response.status(200).json({result: JSON.stringify(arr)});
				return response.end();
			}).catch(function (err) {
				response.status(400).json({error: "Error with queryDataset"});
				return response.end();
			});
		} catch(err) {
			response.status(400).json({error: "Error with queryDataset"});
			return response.end();
		}
	}

	private static getDataset(request: Request, response: Response) {
		try {
			Server.facade.listDatasets().then(function (arr: any) {
				response.status(200).json({result: arr});
				return response.end();
			}).catch(function (err) {
				response.status(400).json({error: "Error with getDataset"});
				return response.end();
			});
		} catch(err) {
			response.status(400).json({error: "Error with getDataset"});
			return response.end();
		}
	}
}
