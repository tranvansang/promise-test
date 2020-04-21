/* eslint-disable prefer-promise-reject-errors */
const flipPromise = require('flip-promise').default

describe('promise', () => {
	test('error catch with resolve', () => new Promise(async (rs, rj) => {
		const getPromise = () => new Promise(resolve => {
			try {
				resolve()
			} catch (err) {
				rj('error caught in unexpected location')
			}
		})
		try {
			await getPromise()
			throw new Error('error thrown out side')
		} catch (e) {
			rs('error caught in expected location')
		}
	}))
	test('error catch with reject', () => new Promise(async (rs, rj) => {
		const getPromise = () => new Promise((_resolve, reject) => {
			try {
				reject()
			} catch (err) {
				rj('error caught in unexpected location')
			}
		})
		try {
			await getPromise()
		} catch (e) {
			try {
				throw new Error('error thrown out side')
			} catch (e){
				rs('error caught in expected location')
			}
		}
	}))
	test('await multiple times resolved promise', async () => {
		const pr = Promise.resolve(1)
		expect(await pr).toBe(1)
		expect(await pr).toBe(1)
	})
	test('await multiple times rejected promise', async () => {
		const pr = Promise.reject(1)
		expect(await flipPromise(pr)).toBe(1)
		expect(await flipPromise(pr)).toBe(1)
	})
	test('resolve multiple times', async () => {
		const pr = new Promise(resolve => {
			resolve(1)
			resolve(2)
			resolve(3)
		})
		expect(await pr).toBe(1)
	})
	test('resolve then reject', async () => {
		const pr = new Promise((resolve, reject) => {
			resolve(1)
			resolve(2)
			resolve(3)
			reject(4)
		})
		expect(await pr).toBe(1)
	})
	test('reject multiple times', async () => {
		const pr = new Promise((_resolve, reject) => {
			reject(1)
			reject(2)
			reject(3)
		})
		expect(await flipPromise(pr)).toBe(1)
	})

	test('reject then resolve', async () => {
		const pr = new Promise((resolve, reject) => {
			reject(1)
			reject(2)
			reject(3)
			resolve(4)
		})
		expect(await flipPromise(pr)).toBe(1)
	})
})
