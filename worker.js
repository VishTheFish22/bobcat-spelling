importScripts('https://unpkg.com/dexie/dist/dexie.js');
const db = new Dexie('spellingbee'); 
db.version(23).stores({ words: '++id, cat' });
db.on("ready", (tx) => {
	return tx.words.count( function (count) {
		if( count < 1 ) {
			urls = ["./data/set1.json", "./data/set2.json"]
			return Promise.all(urls.map(url => fetch(url)))
		   					.then(responses => Promise.all(responses.map((response)=>response.json())))
							.then(function (jsonObjs) {
								let acc = []
								jsonObjs.forEach( (jsonObj) => {
									jsonObj.forEach((item) => {
										mp3 = atob(item["mp3"])
										const arr = new Uint8Array(mp3.length)
										arr.map(function (element, index, uarray) {
											uarray[index] = mp3.charCodeAt(index)
										})
										const blob = new Blob([arr], {type: 'audio/mp3'})
										item["mp3"] = blob				
										acc.push(item)
									})
								})
								console.log(acc.length)
								tx.words.bulkPut(acc)
							})
		}
	})
});

self.addEventListener('message', async function(e) { 
	let action = e.data["action"]
	switch(action)
	{
		case "install":
			this.postMessage({msg:"installing"})
			await db.open()
			this.postMessage({msg:"ready"})
			break;
		case "query":
			console.log("query ---- " + e.data)
			const cat = e.data["cat"]
			const keys = await db.words.where('cat').equals(cat).primaryKeys()
			const keys_array = [...keys.values()]
			//shuffle
			let len = keys_array.length
			for(i=0;i<keys_array.length;i++)
			{
				swapidx = Math.floor(Math.random() * len)
				a = keys_array[i];
				keys_array[i] = keys_array[swapidx];
				keys_array[swapidx] = a;
			}
			console.log(keys_array)
			this.postMessage({msg:"data", data:{"cat":cat, "keys":keys_array}})
			break;
		case "play":
			console.log(e)
			console.log(e.data.id)
			const entry = await db.words.where('id').equals(e.data["id"].toString()).first()
			this.postMessage({msg:"answer", data:entry})
			break;				
	}
})
