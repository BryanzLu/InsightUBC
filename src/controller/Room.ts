export class Room {
	private fullname: string;
	private shortname: string;
	private number: string;
	private name: string;
	private address: string;
	private lat: number;
	private lon: number;
	private seats: number;
	private type: string;
	private furniture: string;
	private href: string;

	constructor(
		fullName: string,
		shortName: string,
		number: string,
		name: string,
		address: string,
		lat: number,
		lon: number,
		seats: number,
		type: string,
		furniture: string,
		href: string,
	) {
		this.fullname = fullName;
		this.shortname = shortName;
		this.number = number;
		this.name = name;
		this.address = address;
		this.lat = lat;
		this.lon = lon;
		this.seats = seats;
		this.type = type;
		this.furniture = furniture;
		this.href = href;
	}

	// some basic getters for each of the private fields
	public getFullName(): string {
		return this.fullname;
	}

	public getShortName(): string  {
		return this.shortname;
	}

	public getNumber(): string  {
		return this.number;
	}

	public getName(): string  {
		return this.name;
	}

	public getAddress(): string  {
		return this.address;
	}

	public getLat(): number {
		return this.lat;
	}

	public getLon(): number {
		return this.lon;
	}

	public getSeats(): number {
		return this.seats;
	}

	public getType(): string {
		return this.type;
	}

	public getFurniture(): string {
		return this.furniture;
	}

	public getHref(): string {
		return this.href;
	}

	public setLat(lat: number) {
		this.lat = lat;
	}

	public setLon(lon: number) {
		this.lon = lon;
	}
}
