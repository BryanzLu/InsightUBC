export class Building {
	private fullName: string;
	private shortName: string;
	private address: string;
	private path: string;
	private lat: number;
	private lon: number;

	constructor(
		fullName: string,
		shortName: string,
		address: string,
		path: string,
		lat: number,
		lon: number
	) {
		this.fullName = fullName;
		this.shortName = shortName;
		this.address = address;
		this.path = path;
		this.lat = lat;
		this.lon = lon;
	}

	public getFullName() {
		return this.fullName;
	}

	public getShortName() {
		return this.shortName;
	}

	public getAddress() {
		return this.address;
	}

	public getPath() {
		return this.path;
	}

	public getLat() {
		return this.lat;
	}

	public getLon() {
		return this.lon;
	}

	public setLon(lon: number) {
		this.lon = lon;
	}

	public setLat(lat: number) {
		this.lat = lat;
	}
}
