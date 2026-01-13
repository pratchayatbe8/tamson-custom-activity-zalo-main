/**
 * ============================================================================
 * Server Side Controller
 * ============================================================================
 */
const mc = require('../modules/mc');
const controller = {};
const config = require("../config");
const { v4: uuidv4 } = require('uuid');

const zalo = require('../modules/zalo');
const logger = require('../modules/logger');
const jwt = require('jsonwebtoken');
const util = require('../modules/util');

/**
 * ============================================================================
 * Execute
 * ============================================================================
 */

controller.execute = async (req, res) => {
    try {
        const data = require('jsonwebtoken').verify(req.body.toString('utf8'), config.sfmc.jwt, { algorithm: 'HS256' });
        if (data) {
            await process(data);
            res.sendStatus(200);

        }
        else {
            console.log('[controller.execute] ERROR: Execute Data not available');
            res.sendStatus(200);
        }
    }
    catch (err) {
        console.log('[controller.execute] FETAL ERROR: ', err.message);
        res.sendStatus(200);
    }

}

/**
 * ============================================================================
 * Process Function after execute
 * ============================================================================
 */

async function process(body) {

    const obj = body.inArguments[0];
    const activityRequestId = uuidv4();
    const record = obj.targetValues;

    const mcRecord = {
        'Request_ID': activityRequestId,
        'Zalo_ID': obj.uid,
        'Message_Name': obj.messageName,
        // 'Journey_Name' : obj.settings.journeyName, //Use automation to fetch these using activityId will get latest value
        // 'Journey_ID' : obj.settings.journeyVersionId,
        // 'Journey_Version': obj.settings.journeyVersion,
        'Message_Type': obj.messageType,
        'OA_ID': obj.zaloAccount,
        'OA_Name': obj.zaloAccountName,
        'Activity_ID': body.activityId,
    };

    try {

        const token = await util.getZaloAccessToken(obj.zaloAccount);
        let zaloPayload = {};
        let zaloMessageType = 'CONSULTING';

        if (obj.messageType === 'ZaloOA') {
            const content = obj.zaloContentObject;

            let zaloMessage = content.meta.options.customBlockData.message;

            if (content.meta.options.customBlockData.type === 'text-area' || content.meta.options.customBlockData.type === 'form-photo') {
                const expr = /%%[\w-]+%%/g;
                const matches = zaloMessage.text.match(expr);
                if (matches) {
                    matches.forEach(matchedItem => {
                        const fieldName = matchedItem.substring(2, matchedItem.length - 2);
                        if (record[fieldName])
                            zaloMessage.text = zaloMessage.text.replace(matchedItem, record[fieldName]);
                    });
                }
            }
            else if (content.meta.options.customBlockData.type === 'communication') {
                zaloMessageType = 'MEDIA';

                zaloMessage.attachment.payload.elements.forEach(el => {
                    if (el.type === 'header' || el.type == 'text') {
                        const expr = /%%[\w-]+%%/g;
                        const matches = el.content.match(expr);
                        if (matches) {
                            matches.forEach(matchedItem => {
                                const fieldName = matchedItem.substring(2, matchedItem.length - 2);
                                if (record[fieldName])
                                    el.content = el.content.replace(matchedItem, record[fieldName]);
                            });
                        }
                    }
                    else if (el.type === 'table') {
                        el.content.forEach(item => {
                            const expr = /%%[\w-]+%%/g;
                            const matches = item.value.match(expr);
                            if (matches) {
                                matches.forEach(matchedItem => {
                                    const fieldName = matchedItem.substring(2, matchedItem.length - 2);
                                    if (record[fieldName])
                                        item.value = item.value.replace(matchedItem, record[fieldName]);
                                });
                            }
                        })
                    }
                });
            }
            else if (content.meta.options.customBlockData.type === 'transaction') {
                zaloMessage.attachment.payload.elements.forEach(el => {
                    if (el.type === 'header' || el.type == 'text') {

                        const expr = /%%[\w-]+%%/g;
                        const matches = el.content.match(expr);
                        if (matches) {
                            matches.forEach(matchedItem => {
                                const fieldName = matchedItem.substring(2, matchedItem.length - 2);
                                if (record[fieldName])
                                    el.content = el.content.replace(matchedItem, record[fieldName]);
                            });
                        }
                    }
                    else if (el.type === 'table') {
                        el.content.forEach(item => {

                            const expr = /%%[\w-]+%%/g;
                            const matches = item.value.match(expr);
                            if (matches) {
                                matches.forEach(matchedItem => {
                                    const fieldName = matchedItem.substring(2, matchedItem.length - 2);
                                    if (record[fieldName])
                                        item.value = item.value.replace(matchedItem, record[fieldName]);
                                });
                            }
                        })
                    }
                });
                zaloMessageType = 'TRADING';
            }
            else if (content.meta.options.customBlockData.type === 'notice') {
                // let fileName = content.meta.options.customBlockData.fileName,
                // fileUrl = content.meta.options.customBlockData.u['notice-file'],
                // fileKey = `file_${content.meta.options.customBlockData.fileId}`;

                // let cachedFile = util.getFromCache(fileKey);
                // if(cachedFile !== undefined) {
                //     zaloMessage.attachment.payload.token = cachedFile;
                // }
                // else {
                //     const fileResponse = await mc.downloadFile(fileUrl);
                //     const zaloFileResponse = await zalo.uploadFile(token, fileResponse.data, fileName);
                //     if(zaloFileResponse.data.error === 0) {
                //         const zaloFileToken = zaloFileResponse.data.data.token;
                //         util.addToCache(fileKey, zaloFileToken);
                //         zaloMessage.attachment.payload.token = zaloFileToken;
                //     }
                //     else {
                //         logger.error(`Error during uploading file to Zalo ${JSON.stringify(zaloFileResponse.data)}`);
                //     }                    
                // }
            }

            zaloPayload = {
                'recipient': {
                    'user_id': obj.uid,
                },
                'message': zaloMessage
            };


        }
        else { // messageType is ZaloZNS
            const template = obj.zaloContentObject;
            const templateData = {};
            template.data.listParams.forEach(item => {
                let paramName = item.name.replace(/___/g, ':');
                let paramValue = record[paramName] ? record[paramName] : 'N/A';
                if (item.type.toUpperCase() === 'NUMBER') {
                    paramValue = parseInt(paramValue);

                    if (isNaN(paramValue))
                        paramValue = 0;
                }
                else if (item.type.toUpperCase() === 'DATE') {
                    const n = Date.parse(paramValue);
                    if (isNaN(n)) {
                        paramValue = new Date('01/01/1900').toLocaleDateString('en-GB');
                    }
                    else {
                        paramValue = new Date(n).toLocaleDateString('en-GB');
                    }
                }
                else { //STRING
                    paramValue = paramValue.substring(0, item.maxLength);
                }

                templateData[item.name] = paramValue;
            });

            zaloPayload = {
                "phone": obj.uid,
                "template_id": obj.zaloContentId,
                "template_data": templateData
            };

        }

        // console.log('[process] DEBUG: zaloPayload: ', zaloPayload);
        const sentDate = new Date();
        mcRecord['Sent_Date'] = sentDate.toISOString();
        mcRecord['Template_ID'] = obj.zaloContentId;

        const zaloResponse = await zalo.sendMessage(token, zaloPayload, obj.messageType, zaloMessageType);
        let zaloMessageId = '';
        if (zaloResponse.data.error === 0) {
            zaloMessageId = (obj.messageType === 'ZaloOA') ? zaloResponse.data.data.message_id : zaloResponse.data.data.msg_id;
            mcRecord['API_Response_Code'] = zaloResponse.data.error;

        }
        else { //Zalo return error
            logger.error(`[Zalo Response Error] - ${obj.contactKey}-${obj.uid} - ${JSON.stringify(zaloResponse.data)}`);
            mcRecord['API_Response_Error'] = zaloResponse.data.message;
            mcRecord['API_Response_Code'] = zaloResponse.data.error;
            zaloMessageId = `ERROR_${activityRequestId}`;
        }

        mcRecord['Message_ID'] = zaloMessageId;
        //Tracking sent message
        mc.createDERow(config.sfmc.logDeName, mcRecord).catch(mcError => {
            logger.error(`[MC Error during creating tracking record] - ${obj.contactKey}-${obj.uid} -  ${mcError}`);
        })

    }
    catch (err) {
        // Activity Level Error
        mcRecord['Message_ID'] = `ERROR_${activityRequestId}`;
        mcRecord['Activity_Error'] = err.message;

        logger.error(`[Exception in processRequest] ${obj.contactKey}-${obj.uid} - ${err} -${err.stack}`);

        //Tracking sent message
        mc.createDERow(config.sfmc.logDeName, mcRecord).catch(mcError => {
            logger.error(`[MC Error during creating tracking record] - ${obj.contactKey}-${obj.uid} -  ${mcError}`);
        })
    }
}

/**
 * ============================================================================
 * Utilities of Controller
 * ============================================================================
 */
controller.getDataExtensions = () => {
    return mc.getAllDataExtensions();
};
controller.getDERows = (dataExtensionName, fields, filter) => {
    return mc.getDERows(dataExtensionName, fields, filter);
};
controller.getDataExtensionFields = (dataExtensionKey) => {
    return mc.getDataExtensionFields(dataExtensionKey);
};
// controller.getContentById = (contentId) => {
//     return mc.getContentById(contentId, ['Views']);
// }

controller.getZaloMessages = () => {
    let fields = ['Id', 'Name'],
        zaloFolderName = config.sfmcContentCategories.customBlockPrefix,
        assetTypeId = config.sfmcAssetTypes.customBlock;

    let query = {
        "leftOperand":
        {
            "property": "name",
            "simpleOperator": "startsWith",
            "value": zaloFolderName
        },
        "logicalOperator": "AND",
        "rightOperand":
        {
            "property": "assetType.id",
            "simpleOperator": "equals",
            "value": assetTypeId
        }
    }


    return mc.getContent(fields, query);
}

controller.getCustomContentBlocks = async () => {
    let fields = ['Id', 'Name', 'meta'],
        zaloFolderName = config.sfmcContentCategories.customBlockPrefix,
        assetTypeId = config.sfmcAssetTypes.customBlock;

    let query = {
        "leftOperand":
        {
            "property": "name",
            "simpleOperator": "startsWith",
            "value": zaloFolderName
        },
        "logicalOperator": "AND",
        "rightOperand":
        {
            "property": "assetType.id",
            "simpleOperator": "equals",
            "value": assetTypeId
        }
    }


    return mc.getContent(fields, query);
}

controller.getContentById = (contentId) => {
    let fields = ['content', 'meta'];
    let result = mc.getContentById(contentId, fields);
    return result;
};

controller.getZNSTemplates = async (oa) => {
    try {
        const token = await util.getZaloAccessToken(oa);
        const templates = await zalo.getZNSTemplates(token);
        return templates.data.data
    }
    catch (err) {
        console.log('[controller.getZNSTemplates] FETAL ERROR: getZNSTemplates:', err)
        return []
    }
};

controller.getZNSTemplateDetail = async (templateId, oa) => {
    try {
        const token = await util.getZaloAccessToken(oa);
        const template = await zalo.getZNSTemplateDetail(token, templateId);
        return template;
    }
    catch (err) {
        console.log('[controller.getZNSTemplateDetail] ERROR: getZNSTemplateDetail:', err)
        return { data: {} }
    }
}

module.exports = controller; 
