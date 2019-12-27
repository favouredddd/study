const path = require("path");
const fs = require("fs");
const jschardet = require("jschardet");
const encoding = require("encoding");
const deleteFile = require('./deleteFile');
const { WowLogger } = require("@tencent/wow-core")
const logger = new WowLogger("caige_tools").logger
const doCopy = async (outputEncodeFile, resultBuffer) => {
    return await new Promise((resolve, reject) => {
        fs.writeFile(outputEncodeFile, resultBuffer, (err) => {
            if (err) {
                reject(false);
            }
            resolve(true);
        })
    })
}
const copyfile = async (file, dir) => {
    const filePath = path.join(dir, file.name);
    if (fs.existsSync(filePath)) {
        logger.info("文件存在", filePath)
        await deleteFile(filePath);
    }
    if (!fs.existsSync(file.path)) {
        logger.info("文件不存在", file.path)
        return false;
    }
    try {
        //只处理csv文件,转码
        let fileName = /\.(csv)$/g.test(file.name);
        if (fileName) {
            let csvBuff = fs.readFileSync(file.path);
            let info = jschardet.detect(csvBuff);
            if (info.encoding == "GB2312" || info.encoding == "ascii") {
                logger.info("-- 发现数据文件各位是GB2313，正在转码为utf8....")
                csvBuff = encoding.convert(csvBuff, "UTF-8", info.encoding);
            }
            console.log(filePath)
            return await doCopy(filePath, csvBuff);
        }
        const readStream = fs.createReadStream(file.path)
        const writeStream = fs.createWriteStream(filePath)
        readStream.pipe(writeStream);
        // logger.info("拷贝文件>>", file.name);
        return true;
    } catch{
        return false;
    }
}
module.exports = { copyfile, doCopy };