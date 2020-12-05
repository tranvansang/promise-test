const flipPromise = promise => new Promise(
	(resolve, reject) => Promise.resolve(promise).then(reject).catch(resolve)
)

let prefix = ''
const describe = (name, addTests) => {
	const prevPrefix = prefix
	prefix += name
	addTests()
	prefix = prevPrefix
}
const tests = []
const test = (name, runTest) => void tests.push([prefix + name, runTest])
const expect = val => ({
	toBe(expected) {
		if (val !== expected) throw new Error(`expected ${expected} but received ${val}`)
	},
	toBeUndefined() {
		if (val !== undefined) throw new Error(`expected undefined but received ${val}`)
	},
	toEqual(expected) {
		return expect(JSON.stringify(val), JSON.stringify(expected))
	}
})
const start = async () => {
	for (const [name, runTest] of tests) {
		console.log(name)
		try {
			await runTest()
			console.log('ok')
		} catch (e) {
			console.error(e)
		}
	}
}

describe('promise', () => {
	describe('error catching', () => {
		test('error catch with resolve', () => new Promise(async (rs, rj) => {
			const getPromise = () => new Promise(resolve => {
				try {
					resolve()
				} catch {
					rj('error caught in unexpected location')
				}
			})
			try {
				await getPromise()
				throw new Error('error thrown out side')
			} catch {
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
			} catch {
				try {
					throw new Error('error thrown out side')
				} catch {
					rs('error caught in expected location')
				}
			}
		}))
	})
	describe('multitimes', () => {
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
	describe('constructor', () => {
		describe('sync', () => {
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
			test('constructor is sync until the first await', async () => {
				let val
				let val1
				const pr = new Promise(async resolve => {
					val = 1
					await 1
					val1 = 2
					resolve()
					val1 = 3
				})
				expect(val).toBe(1)
				expect(val1).toBeUndefined()
				await pr
				expect(val1).toBe(3)
			})
		})
		describe('error thrown synchronously in constructor', () => {
			test('constructor reject if error thrown', async () => {
				await flipPromise(new Promise(() => { throw new Error('my err') }))
			})
			test('constructor reject if resolve then reject', async () => {
				await new Promise(resolve => {
					resolve()
					throw new Error('an error')
				})
			})
			test('constructor returns a rejected promise when error is thrown synchronously', async () => {
				const promise = new Promise(() => {
					throw new Error('an error')
				})
				await flipPromise(promise)
			})
		})
		describe('duplicated operation', () => {
			test('the first returned (reject function) is used', async () => {
				expect(await flipPromise(new Promise((resolve, reject) => {
					reject(1)
					throw 2
				}))).toBe(1)
			})
		})
		describe('execution order', () => {
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
				const orders = []
				let promise = 0
				promise = new Promise(resolve => {
					values[0] = promise
					orders.push(0)
					promise = 1
					resolve(2)
					values[1] = promise
					orders.push(1)
				})
				values[2] = await promise
				orders.push(2)
				promise = await promise
				promise = new Promise(async resolve => {
					values[3] = promise
					orders.push(3)
					promise = 3
					resolve(4)
					values[4] = promise
					orders.push(4)
				})
				values[5] = await promise
				orders.push(5)
				expect(values).toEqual({
					0: 0,
					1: 1,
					2: 2,
					3: 2,
					4: 3,
					5: 4,
				})
				expect(orders).toEqual([0, 1, 2, 3, 4, 5])
			})
			test('constructor execute before promise created (3)', async () => {
				const values = {}
				const orders = []
				let promise = 0
				promise = new Promise(async resolve => {
					values[1] = promise
					orders.push(1)
					resolve(1)
					values[2] = promise
					orders.push(2)
					await new Promise(async resolve => {
						values[3] = await promise
						orders.push(3)
						setTimeout(resolve, 100)
					})
					values[4] = await promise
					orders.push(4)
					promise = 2
					values[5] = promise
					orders.push(5)
				})
				values[6] = await promise
				orders.push(6)
				await new Promise(resolve => setTimeout(resolve, 100)) // (*). try removing this line, result will change
				values[7] = await promise
				orders.push(7)
				expect(values).toEqual({
					1: 0,
					2: 0,
					3: 0,
					4: 1,
					5: 2,
					6: 1,
					7: 2
				})
				expect(orders).toEqual([1, 2, 3, 6, 4, 5, 7])
			})
		})
	})
	describe('async function', () => {
		test('setTimeout execute after assignment', () => {
			let val = 1
			setTimeout(() => {
				val = 2
			})
			expect(val).toBe(1)
		})
		test('should do we await a promise return?', async () => {
			const a = (async () => {
				try {
					return await Promise.reject(1)
				} catch (e){
				}
			})()
			expect(await a).toBeUndefined()
		})
		test('async function stop at await', async () => {
			let p1 = 0
			const orders = []
			const f = async (v) => {
				await p1
				orders.push(v)
			}
			let p2 = f(1)
			orders.push(2)
			await p2

			p1 = Promise.resolve()
			p2 = f(3)
			orders.push(4)
			await p2
			expect(orders).toEqual([2, 1, 4, 3])
		})
		test('async function stop at await even with a static constant', async () => {
			const orders = []
			const f = async () => {
				await 0
				orders.push(1)
			}
			let promise = f()
			orders.push(2)
			await promise
			expect(orders).toEqual([2, 1])
		})
		test('then calls schedule orders', async () => {
			const orders = []
			const p = new Promise(async resolve => {
				resolve()
				await 0
				orders.push(1)
			})
			orders.push(2)
			await p
			orders.push(3)
			expect(orders).toEqual([2, 1, 3])
		})
	})
})

start()
