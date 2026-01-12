const config = require('../config');
const mc = require('../modules/mc');

const controller = {}; 

controller.getFiles =  (type) => {
    let fields = ['Name', 'fileProperties'], 
        assetTypeId = '', 
        zaloFolderId = '';
    
    if(type == 'FILE'){
        zaloFolderId = config.sfmcContentCategories.files, 
        assetTypeId = config.sfmcAssetTypes.files;
    }
    else if(type == 'BANNER'){
        zaloFolderId = config.sfmcContentCategories.bannerImages;
        assetTypeId = config.sfmcAssetTypes.images;
    }
    else {
        zaloFolderId = config.sfmcContentCategories.linkImages;
        assetTypeId = config.sfmcAssetTypes.images;
    }

    let query = { 
        "leftOperand":
        {
            "property":"category.id",
            "simpleOperator":"equal",
            "value": zaloFolderId
        },
        "logicalOperator":"AND",
        "rightOperand":
        {
            "property":"assetType.id",
            "simpleOperator":"in",
            "value": assetTypeId
        }
    }

    return mc.getContent(fields, query);
    
}
module.exports = controller; 