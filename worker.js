importScripts('https://unpkg.com/dexie/dist/dexie.js');
const db = new Dexie('spellingbeewords'); 
db.version(13).stores({ words: '++id, cat' });
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
										mp3 = atob(item.mp3)
										const arr = new Uint8Array(mp3.length)
										arr.map(function (element, index, uarray) {
											uarray[index] = mp3.charCodeAt(index)
										})
										const blob = new Blob([arr], {type: 'audio/mp3'})
										item.mp3 = blob				
										acc.push(item)
									})
								})
								tx.words.bulkPut(acc)
							})
		}
	})
});

function randomize(arr)
{
	//shuffle
	for(i=0;i<arr.length;i++)
	{
		swapidx = Math.floor(Math.random() * arr.length)
		a = arr[i];
		arr[i] = arr[swapidx];
		arr[swapidx] = a;
	}

	return arr
}

self.addEventListener('message', async function(e) { 
	switch(e.data.action)
	{
		case "install":
			this.postMessage({
				msg:"installing"
			})
			await db.open()
			this.postMessage({
				msg:"ready"
			})
			break;
		case "query":
			const keys = await db.words.where('cat').equals(e.data.cat).primaryKeys()
			this.postMessage({
				msg:"data", 
				data:{
					"cat": e.data.cat, 
					"keys": randomize([...keys.values()])
				}
			})
			break;
		case "play":
			this.postMessage({
				msg: "answer", 
				data: await db.words.where('id').equals(e.data.id).first()
			})
			break;				
	}
})
