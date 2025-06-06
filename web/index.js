const upload = document.getElementById("upload");
const file = document.getElementById("file");
const worker = new Worker("./worker.js");
const chunkSize = 1024 * 1024 * 5; //5MB
const chunks = [];

//file对象是继承于blob blob会提供一个方法slice 进行切分
//file blob都是二进制
upload.addEventListener("click", () => {
    const fs = file.files[0]; //读取文件内容
    const total = Math.ceil(fs.size / chunkSize); //切割的总数 也就是我们要掉23次接口
    //0-5 5-10 10-15 15-20 20-25
    chunks.push(...Array.from({ length: total }, (_, i) => fs.slice(i * chunkSize, (i + 1) * chunkSize)));
    //worker.js 会接收这个消息
    worker.postMessage({
        chunks,
        filename: fs.name,
    });
});


worker.onmessage = async function (e) {
    const { filename, hash } = e.data;
    const res = await fetch(`http://localhost:3000/verify?hash=${hash}`)
    const { files } = await res.json();
    const set = new Set(files)
    const tasks = chunks.map((chunk, index) => ({ chunk, index })).filter(({ index }) => {
        return !set.has(`${filename}-${index}`)
    })
    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    for (const { chunk, index } of tasks) {
        const formData = new FormData();
        formData.append("filename", filename);
        formData.append("hash", hash);
        formData.append("index", index);
        formData.append("file", chunk);
        await fetch("http://localhost:3000/upload", {
            method: "POST",
            body: formData
        })

        //await sleep(2000)
    }

    await fetch(`http://localhost:3000/merge?hash=${hash}&filename=${filename}`)
}


