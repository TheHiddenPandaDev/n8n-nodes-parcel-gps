export class ParcelGpsInputError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'ParcelGpsInputError';
	}
}
