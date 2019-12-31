const { Parser } = require('json2csv');
const Checker = require("./check_xml");
const { copyfile, doCopy } = require("./copyFile");
const deleteFile = require('./deleteFile');
const path = require("path");
const fs = require('fs');
const { WowLogger } = require("@tencent/wow-core")
const logger = new WowLogger("caige_tools").logger
const transform = async (arr, number) => {
    console.log(`开始切片${number}一个文件`)
    const spliteArr = [];
    arr = arr;
    console.log(`开始切片一共${arr.length}文件`)
    while (arr.length) {
        const r = arr.slice(0, number)
        spliteArr.push(r);
        arr = arr.slice(number);
    }
    return { spliteArr };
}
const check = async (checkAudio, fileName) => {
    console.log("check 服务")
    const csvPath = path.resolve(__dirname, `./tem/${fileName}.csv`);
    const dirPath = path.resolve(__dirname, "./org/audios/");
    console.log(fs.readdirSync(dirPath).length)
    Checker.setCheckItem(csvPath, dirPath + "/")

    try {
        const errorMessage = await Checker.start(checkAudio);
        logger.info("检查完毕");
        if (!checkAudio) {
            return errorMessage;
        }
        if (errorMessage.msg && errorMessage.msg.length) {
            return {
                code: 1,
                error: true,
                msg: errorMessage.msg
            }
        }
        logger.info("文件正确");
        return {
            code: 1,
            error: false,
            totalFileData: errorMessage.totalFileData,
            audioPath: dirPath + "/"
        }
    }
    catch{
        return { error: true, msg: "函数调用错误" }
    }
}
const baseUrl = path.join(__dirname, './tem/');
const audioUrl = path.join(__dirname, './org/audios/');
const splitFile = async (data, fileName) => {
    const dir = baseUrl + fileName
    if (fs.existsSync(dir)) {
        await deleteFile(dir)
    }
    fs.mkdirSync(dir);
    return await Promise.all(data.map((item, index) => {
        return new Promise(async (resolve, reject) => {
            // console.log(item)
            const fields = Object.keys(item[0]);
            item.forEach(i => {
                Object.keys(i).forEach(j => {
                    i[j] = i[j].replace(/\,/g, "|");
                })
            })
            const myCars = item;
            const json2csvParser = new Parser({ fields: fields, withBOM: true, quote: '', });
            const csv = json2csvParser.parse(myCars);
            const fileDir = dir + '/' + index;
            if (fs.existsSync(fileDir)) {
                await deleteFile(fileDir)
            }
            fs.mkdirSync(fileDir);
            const csvUrl = fileDir + '/' + index + '.csv';
            await doCopy(csvUrl, Buffer.from(csv));
            const copyResult = await Promise.all(item.map(j => {
                const fileUrl = audioUrl + j["文件命名"];
                return copyfile({ name: j["文件命名"], path: fileUrl }, fileDir + '/')
            }))
            resolve(true);
        }).then(() => true, () => false);
    }))
}
const start = async () => {
    const fileName = process.argv[2];
    const number = parseInt(process.argv[3]) || 100;
    const opt = { name: `${fileName}.csv`, path: path.join(__dirname, `./org/${fileName}.csv`) };
    const copyResult = await copyfile(opt, path.join(__dirname, './tem/'))
    const { data, error } = await check(false, fileName)
    console.log(data.length)
    const { spliteArr } = await transform(data, number);
    const doSplitResult = splitFile(spliteArr, fileName);
}
start();