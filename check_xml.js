
const fs = require('fs');
const path = require("path")
// const readline = require('readline');
const csv = require('csvtojson');
const { WowLogger } = require("@tencent/wow-core")
const logger = new WowLogger("caige_tools").logger
let outputEncodeFile;
let audioPath;
let checklist;
let checkIndex = 0;      //文件下标
let errorNum = 0;
let errorString = [];
let checkItemIndex = 0;  // item 下标


const CheckXmler = {
    message: [],
    setCheckItem(filepath, audioPath) {
        this.message = [];
        this.totalFileData = [];
        checklist = [[filepath, audioPath]];
        checkIndex = 0;
        checkItemIndex = 0;
        errorString = [];
        errorNum = 0;
    },
    setCheckList(list) {
        checklist = list;
        checkIndex = 0;
        checkItemIndex = 0;
    },

    async start(checkAudio) {
        audioPath = checklist[checkIndex][1];
        outputEncodeFile = checklist[checkIndex][0];
        logger.info("开始校验", checklist);
        const checkData = await this.readDataToArray(checkAudio);
        if (!checkAudio) {
            return { data: checkData, error: false }
        }
        return { msg: this.message, totalFileData: this.totalFileData };
    },
    async readDataToArray(checkAudio) {
        logger.info("开始解析文件")
        let totalFileData;
        const checkResult = await csv()
            .fromFile(outputEncodeFile)
            .then((jsonObj) => {
                totalFileData = jsonObj
                //     .map(item => {
                //     return Object.values(item)
                // });
                return true;
            }).catch(err => {
                return false;
            })
        if (!checkResult) {
            logger.info('csv转换错误');
            return false;
        }
        logger.info("开始存储数据");
        this.totalFileData = totalFileData;
        if (!checkAudio) {
            return totalFileData;
        }
        await this.testSaveOneSongMission(0, totalFileData);
    },
    async testSaveOneSongMission(index, totalFileData) {
        if (index >= totalFileData.length) {
            logger.info("-----------check all is over-----------");
            logger.info("错误数据量：" + errorNum);
            this.message = errorString;
            return true;
        }
        var obj = totalFileData[index];
        checkItemIndex++;
        // logger.info(`saveData ${checkItemIndex} : ${obj}`);
        if (obj == null) {
            index++;
            await this.testSaveOneSongMission(index, totalFileData);
            return;
        }
        let filename = trimValue(obj[1]);
        let missionnum = parseInt(obj[0]);
        let extName = path.extname(filename);
        // ParseFile上传中文名称文件会上传失败
        let renameAudioPath = `${audioPath}rename/song_${missionnum}${extName}`;
        let tempDir = audioPath + "rename/";
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir);
        }
        if (!fs.existsSync(audioPath + filename)) {
            logger.info("文件不存在", audioPath + filename)
            index++;
            errorNum++;
            errorString.push(`文件：${filename}, 错误`);
            return await this.testSaveOneSongMission(index, totalFileData);
        }
        await new Promise((resolve, reject) => {
            fs.copyFile(audioPath + filename, renameAudioPath, (err) => {
                if (err) {
                    errorNum++;
                    logger.info("序号：" + index + "目录:" + audioPath + "文件:", filename);
                    errorString.push(`文件：${filename}, 错误`);
                    resolve(false);
                }
                index++;
                resolve(true);
            });
        });
        await this.testSaveOneSongMission(index, totalFileData);
    }
}




function trimValue(value) {
    return value.replace(/\?|\"/g, "").trim();
}



module.exports = CheckXmler;