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

	test('constructor is not async', async () => {
		let val
		let val1
		const pr = new Promise(resolve => {
			val = 1
			setTimeout(() => {
				resolve()
				val1 = 2
			})
		})
		expect(val).toBe(1)
		expect(val1).toBeUndefined()
		await pr
		expect(val).toBe(1)
		expect(val1).toBe(2)
	})
	test('constructor reject if error thrown', async () => {
		await flipPromise(new Promise(() => { throw new Error('my err') }))
	})
	test('constructor reject if resolve then reject', async () => {
		await new Promise(resolve => {
			resolve()
			throw new Error('an error')
		})
	})
	test('consider the first returned (reject function)', async () => {
		expect(await flipPromise(new Promise((resolve, reject) => {
			reject(1)
			throw 2
		}))).toBe(1)
	})
	test('constructor execute before promise created', async () => {
		let val = 1
		const promise = new Promise(resolve => {
			val = 2
			resolve(3)
		})
		expect(val).toBe(2)
		await promise
	})
	test('constructor execute before promise created (2)', async () => {
		const values = {}
		let promise = 0
		promise = new Promise(resolve => {
			values[0] = promise
			promise = 1
			resolve(2)
			values[1] = promise
		})
		values[2] = await promise
		promise = await promise
		promise = new Promise(async resolve => {
			values[3] = promise
			promise = 3
			resolve(4)
			values[4] = promise
		})
		values[5] = await promise
		promise = await promise
		promise = new Promise(async resolve => {
			values[6] = promise
			resolve(5)
			await new Promise(resolve => setTimeout(resolve, 100))
			values[7] = await promise
			promise = 6
		})
		values[8] = await promise
		await new Promise(resolve => setTimeout(resolve, 100))
		values[9] = await promise
		expect(values).toEqual({
			0: 0,
			1: 1,
			2: 2,
			3: 2,
			4: 3,
			5: 4,
			6: 4,
			7: 5,
			8: 5,
			9: 5
		})
	})
	test('setTimeout execute after assignment', () => {
		let val = 1
		setTimeout(() => {
			val = 2
		})
		expect(val).toBe(1)
	})
})
