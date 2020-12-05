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
