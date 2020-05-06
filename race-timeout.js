(async () => {
	let val = 1
	const promise = new Promise(async resolve => {
		resolve()
		await new Promise(async r => {
			setTimeout(r)
		})
		await promise
		val = 2
	})
	await promise
	await new Promise(resolve => setTimeout(resolve))
	console.log(val)
})()
