//web Woker浏览器的多线程脚本
//web worker 是运行在后台的js 不会阻塞页面
//可以进行计算 可以进行IO操作 但是不能进行DOM操作
//web worker 不能访问window对象 不能访问document对象
//self 代表当前的worker web worker 的全局作用域
self.importScripts("./spark-md5.min.js");
self.onmessage = function (e) {
    const { chunks, filename } = e.data;
    const spark = new self.SparkMD5.ArrayBuffer(); //计算MD5
    let currentChunk = 0;
    console.log(chunks)
    //需要把blob 转成 ArrayBuffer
    function loadNext() {
        const reader = new FileReader(); //各种格式转换base64 blob arraybuffer file
        reader.onload = function (e) {
            spark.append(e.target.result);
            currentChunk++;
            if (currentChunk < chunks.length) {
                loadNext();
            } else {
                //web Worker 可以发送消息给主线程
                self.postMessage({
                    filename,
                    hash: spark.end(), //一整个文件的md5
                })
            }
        }
        reader.readAsArrayBuffer(chunks[currentChunk]); //读取文件
    }
    loadNext()
}