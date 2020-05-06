(async () => {
	const values = {}
	const orders = []
	let promise = 0
	promise = new Promise(async resolve => {
		values[1] = promise
		orders.push(1)
		resolve(1)
		values[2] = promise
		orders.push(2)
		values[3] = await promise
		orders.push(3)
		await new Promise(resolve => setTimeout(resolve, 100))
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
	console.log(values, orders)
})()
