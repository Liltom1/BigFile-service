const express = require("express");
const cors = require("cors");
const multer = require("multer"); //处理文件上传的中间件
const fs = require("fs");
const path = require("path");
const app = express();


app.use(cors()); //解决跨域

//处理文件上传存放的位置
//处理文件的名字是什么样子的
const storage = multer.diskStorage({
    //处理文件上传的目录
    destination: function (req, file, cb) {
        //mkdirSync 创建文件夹 1.如果有多级会递归创建 2.如果父目录存在则不会创建
        fs.mkdirSync(`server/uploads/${req.body.hash}`, { recursive: true });
        cb(null, `server/uploads/${req.body.hash}/`);
    },
    //处理文件的名字是什么样子的
    filename: function (req, file, cb) {
        cb(null, `${req.body.filename}-${req.body.index}`);
    }
})

const upload = multer({ storage });

//file 前端的key
app.post("/upload", upload.single("file"), (req, res) => {
    res.json({
        success: true,
    })
});

//合并切片 通过文件流合并 appendFile 合并
app.get("/merge", async (req, res) => {
    const { hash, filename } = req.query;
    const files = fs.readdirSync(`server/uploads/${hash}`); //获取切片所在的目录
    const fileArrSort = files.sort((a, b) => a.split("-")[1] - b.split("-")[1]); //根据index排序
    const filePath = path.join(__dirname, hash) //存放合并后的文件
    fs.mkdirSync(filePath, { recursive: true }) //创建目录
    const writeStream = fs.createWriteStream(path.join(filePath, filename)) //创建写入流

    for (const file of fileArrSort) {
        await new Promise((resolve, reject) => {
            console.log(path.join(__dirname, `uploads/${hash}`, file), 'file');
            //创建可读流
            const readStream = fs.createReadStream(path.join(__dirname, `uploads/${hash}`, file))//读取每一个切片
            readStream.pipe(writeStream, { end: false }) //将可读流写入到可写流中
            //因为写进去的时候写完了就会自动关闭 end: false 不让他自动关闭
            readStream.on("end", () => {
                fs.unlinkSync(path.join(__dirname, `uploads/${hash}`, file)) //删除切片
                resolve()
            })
            readStream.on("error", reject)
        })
    }

    writeStream.end() //而是改成手动关闭
    res.json({
        success: true,
    })
})

app.get("/verify", (req, res) => {
    const { hash } = req.query;
    const isExist = fs.existsSync(`server/uploads/${hash}`);
    const isExistFile = fs.existsSync(`server/${hash}`);
    if (!isExist) {
        return res.json({
            success: true,
            files: [],
            isExist: isExistFile,
        })
    }
    const files = fs.readdirSync(`server/uploads/${hash}`);
    res.json({
        success: true,
        files,
        isExist: isExistFile,
    })
})



app.listen(3000, () => {
    console.log("Server is running on port 3000");
});

