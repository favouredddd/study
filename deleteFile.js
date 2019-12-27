const fs = require("fs");
const path = require("path")
const { WowLogger } = require("@tencent/wow-core")
const logger = new WowLogger("caige_tools").logger
const deleteFile = async (filePath) => {
    return await new Promise((resolve, reject) => {
        fs.unlink(filePath, function (err) {
            if (err) {
                reject(false);
            }
            resolve(true)
        })
    })
}
const deleteDir = async (filePath) => {
    if (!fs.existsSync(filePath)) {
        return true;
    }
    // logger.info("开始删除: ", filePath)
    const stats = await new Promise((resolve, reject) => {
        fs.stat(filePath, (err, stats) => {
            if (err) {
                reject(false)
            }
            resolve(stats);
        })
    })
    if (!stats) {
        return false;
    }
    if (stats.isFile()) {
        return await deleteFile(filePath);
    }
    logger.info("删除" + filePath);
    const files = await fs.readdirSync(filePath);
    const results = await Promise.all(files.map(file => {
        let fileDir = path.join(filePath, file);
        return deleteDir(fileDir);
    }))
    if (results.every(i => i)) {
        fs.rmdirSync(filePath);
        logger.info("删除成功", filePath)
        return true;
    }
    return false;
}
module.exports = deleteDir;