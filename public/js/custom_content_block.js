'use strict';

var sdk = new window.sfdc.BlockSDK({
  blockEditorWidth: 740
});

function onLanguageChange(lang) {
  if (lang === 'VI') {
    document.querySelector('#txttransTableKey1').placeholder = 'Tên khách hàng / Mã...';
  }
  else {
    document.querySelector('#txttransTableKey1').placeholder = 'Customer Name / ..Code..';
  }
}

function onMessageTypeChange(selection) {
  document.querySelectorAll('.section').forEach(function (section) {
    section.classList.add('slds-hide');
  });

  if (selection.value)
    document.querySelector(`#${selection.value}`).classList.remove('slds-hide');
}

function showOptions(select) {
  let row = select.dataset.row;
  let prefix = '';
  let type = document.querySelector('#messageType').value;
  if (type === 'transaction') {
    prefix = 'trans';
  }
  else if (type === 'communication') {
    prefix = 'comm'
  }

  let linkSelector = `#${prefix}-list-link${row}`,
    responseSelector = `#${prefix}-list-response${row}`;

  if (select.value === 'button') {
    document.querySelector(responseSelector).classList.remove('slds-hide');
    document.querySelector(linkSelector).classList.add('slds-hide');

  } else if (select.value === 'link') {
    document.querySelector(responseSelector).classList.add('slds-hide');
    document.querySelector(linkSelector).classList.remove('slds-hide');

  }
  else {
    document.querySelector(responseSelector).classList.add('slds-hide');
    document.querySelector(linkSelector).classList.add('slds-hide');
  }
}

function restoreParms() {
  sdk.getData(function (objData) {
    let messageType = (objData.type) ? objData.type : '';
    document.getElementById('messageType').value = messageType;
    document.getElementById('messageType').onchange();

    if (messageType) {
      if (messageType === 'text-area') {
        document.getElementById('txtBlock1').value = objData.u.txtBlock1;
      }
      else if (messageType === 'form-photo') {
        document.getElementById('txtBlock2').value = objData.u.txtBlock2;
        document.getElementById('photo').value = objData.u.photo;
      }
      else if (messageType === 'user-info') {
        document.querySelector('#user-info-title').value = objData.u['user-info-title'];
        document.querySelector('#user-info-subTitle').value = objData.u['user-info-subTitle'];
        document.querySelector('#user-info-image').value = objData.u['user-info-image'];
      }
      else if (messageType === 'notice') {
        document.querySelector("#notice-file").value = objData.u['notice-file'];
      }
      else if (messageType === 'communication') {
        objData.u.forEach((item) => {
          let el = document.querySelector('#' + item.id);
          el.value = item.value;
          if (el.tagName.toLowerCase() == 'select' && el.id.startsWith('comm-list-type'))
            el.onchange();
        });
      }
      else if (messageType === 'transaction') {
        objData.u.forEach((item) => {
          let el = document.querySelector('#' + item.id);
          el.value = item.value;
          if (el.tagName.toLowerCase() == 'select' && el.id.startsWith('trans-list-type'))
            el.onchange();
        });
      }
    }
  });
}

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function paint(messageType) {
  if (messageType === 'text-area') {
    let content = `<p style="width:300px;margin-left:auto; margin-right:auto;">${document.querySelector('#txtBlock1').value}</p>`;
    sdk.setContent(content);
    sdk.setData({
      'type': messageType,
      'typeName': 'Consulting News - Text',
      'u': {
        'txtBlock1': document.querySelector('#txtBlock1').value
      },
      'message': {
        'text': document.querySelector('#txtBlock1').value
      }
    })
  }
  else if (messageType === 'form-photo') {
    let img = '';
    if (document.querySelector('#photo').value)
      img = `<img src="${document.querySelector('#photo').value}" style="width:250px; height:130px;"/>`;

    let content = `<div style="width:300px; margin-left:auto; margin-right:auto">
                  ${img}
                  <div style="padding:5px; background-color:#FFF">${document.querySelector('#txtBlock2').value}</div>
                </div>`;

    sdk.setContent(content);
    sdk.setData({
      'type': messageType,
      'typeName': 'Consulting News - Text with photo',
      'u': {
        'txtBlock2': document.querySelector('#txtBlock2').value,
        'photo': document.querySelector('#photo').value
      },
      'message': {
        'text': document.querySelector('#txtBlock2').value,
        'attachment': {
          'type': 'template',
          'payload': {
            'template_type': 'media',
            'elements': [{
              'media_type': 'image',
              'url': document.querySelector('#photo').value
            }]
          }
        }
      }
    });
  }
  else if (messageType === 'user-info') {
    let img = '';
    if (document.querySelector('#user-info-image').value)
      img = `<img src="${document.querySelector('#user-info-image').value}" style="width:280px; height:130px;"/>`;

    let content = `<div style="width:300px; margin-left:auto; margin-right:auto">
                  ${img}
                  <div style="padding:5px; background-color:#FFF">
                    <span>${document.querySelector('#user-info-title').value}</span> <br/>
                    <span style="color:#A2A4A7;">${document.querySelector('#user-info-subTitle').value}</span>  
                  </div>
                </div>`;

    sdk.setContent(content);
    sdk.setData({
      'type': messageType,
      'typeName': 'Consulting News - User Info Request Form',

      'u': {
        'user-info-title': document.querySelector('#user-info-title').value,
        'user-info-subTitle': document.querySelector('#user-info-subTitle').value,
        'user-info-image': document.querySelector('#user-info-image').value
      },
      'message': {
        'attachment': {
          'type': 'template',
          'payload': {
            'template_type': 'request_user_info',
            "elements": [{
              "title": document.querySelector('#user-info-title').value,
              "subtitle": document.querySelector('#user-info-subTitle').value,
              "image_url": document.querySelector('#user-info-image').value
            }]
          }
        }
      }
    });
  }
  else if (messageType === 'notice') {
    const el = document.querySelector('#notice-file');
    let fileName = el.options[el.selectedIndex].text,
      extension = el.options[el.selectedIndex].dataset.extension,
      fileSize = el.options[el.selectedIndex].dataset.size,
      fileId = el.options[el.selectedIndex].dataset.id,
      content;

    if (el.value) {
      let bgImage = '';
      if (extension == 'pdf') {
        bgImage = 'url("data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20viewBox%3D%220%200%2056%2064%22%3E%3Cpath%20fill%3D%22%238C181A%22%20d%3D%22m5.1%200c-2.8%200-5.1%202.3-5.1%205.1v53.8c0%202.8%202.3%205.1%205.1%205.1h45.8c2.8%200%205.1-2.3%205.1-5.1v-38.6l-18.9-20.3h-32z%22%3E%3C/path%3E%3Cpath%20fill%3D%22%236B0D12%22%20d%3D%22m56%2020.4v1h-12.8s-6.3-1.3-6.1-6.7c0%200%200.2%205.7%206%205.7h12.9z%22%3E%3C/path%3E%3Cpath%20opacity%3D%22.5%22%20fill%3D%22%23fff%22%20enable-background%3D%22new%22%20d%3D%22m37.1%200v14.6c0%201.7%201.1%205.8%206.1%205.8h12.8l-18.9-20.4z%22%3E%3C/path%3E%3Cpath%20fill%3D%22%23fff%22%20d%3D%22m14.9%2049h-3.3v4.1c0%200.4-0.3%200.7-0.8%200.7-0.4%200-0.7-0.3-0.7-0.7v-10.2c0-0.6%200.5-1.1%201.1-1.1h3.7c2.4%200%203.8%201.7%203.8%203.6%200%202-1.4%203.6-3.8%203.6z%20m-0.1-5.9h-3.2v4.6h3.2c1.4%200%202.4-0.9%202.4-2.3s-1-2.3-2.4-2.3z%20m10.4%2010.7h-3c-0.6%200-1.1-0.5-1.1-1.1v-9.8c0-0.6%200.5-1.1%201.1-1.1h3c3.7%200%206.2%202.6%206.2%206s-2.4%206-6.2%206z%20m0-10.7h-2.6v9.3h2.6c2.9%200%204.6-2.1%204.6-4.7%200.1-2.5-1.6-4.6-4.6-4.6z%20m16.3%200h-5.8v3.9h5.7c0.4%200%200.6%200.3%200.6%200.7s-0.3%200.6-0.6%200.6h-5.7v4.8c0%200.4-0.3%200.7-0.8%200.7-0.4%200-0.7-0.3-0.7-0.7v-10.2c0-0.6%200.5-1.1%201.1-1.1h6.2c0.4%200%200.6%200.3%200.6%200.7%200.1%200.3-0.2%200.6-0.6%200.6z%22%3E%3C/path%3E%3C/svg%3E")';
      } else if (extension === 'docx') {
        bgImage = 'url("data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20viewBox%3D%220%200%2056%2064%22%3E%3Cpath%20d%3D%22m5.1%200c-2.8%200-5.1%202.2-5.1%205v53.9c0%202.8%202.3%205.1%205.1%205.1h45.8c2.8%200%205.1-2.3%205.1-5.1v-38.6l-18.9-20.3h-32z%22%20fill-rule%3D%22evenodd%22%20clip-rule%3D%22evenodd%22%20fill%3D%22%2314A9DA%22%3E%3C/path%3E%3Cg%20fill-rule%3D%22evenodd%22%20clip-rule%3D%22evenodd%22%3E%3Cpath%20d%3D%22m56%2020.4v1h-12.8s-6.3-1.3-6.2-6.8c0%200%200.3%205.8%206.1%205.8h12.9z%22%20fill%3D%22%230F93D0%22%3E%3C/path%3E%3Cpath%20d%3D%22m37.1%200v14.6c0%201.6%201.1%205.8%206.1%205.8h12.8l-18.9-20.4z%22%20opacity%3D%22.5%22%20fill%3D%22%23fff%22%3E%3C/path%3E%3C/g%3E%3Cpath%20d%3D%22m14.2%2053.9h-3c-0.6%200-1.1-0.5-1.1-1.1v-9.9c0-0.6%200.5-1%201.1-1h3c3.8%200%206.2%202.6%206.2%206%200%203.4-2.4%206-6.2%206z%20m0-10.7h-2.6v9.3h2.6c3%200%204.7-2.1%204.7-4.6%200-2.6-1.7-4.7-4.7-4.7z%20m14.5%2010.9c-3.6%200-6-2.7-6-6.2s2.4-6.2%206-6.2c3.5%200%205.9%202.6%205.9%206.2%200%203.5-2.4%206.2-5.9%206.2z%20m0-11.1c-2.7%200-4.4%202.1-4.4%204.9%200%202.8%201.7%204.8%204.4%204.8%202.6%200%204.4-2%204.4-4.8%200-2.8-1.8-4.9-4.4-4.9z%20m18.4%200.4c0.1%200.1%200.2%200.3%200.2%200.5%200%200.4-0.3%200.7-0.7%200.7-0.2%200-0.4-0.1-0.5-0.2-0.7-0.9-1.9-1.4-3-1.4-2.6%200-4.6%202-4.6%204.9%200%202.8%202%204.8%204.6%204.8%201.1%200%202.2-0.4%203-1.3%200.1-0.2%200.3-0.3%200.5-0.3%200.4%200%200.7%200.4%200.7%200.8%200%200.2-0.1%200.3-0.2%200.5-0.9%201-2.2%201.7-4%201.7-3.5%200-6.2-2.5-6.2-6.2s2.7-6.2%206.2-6.2c1.8%200%203.1%200.7%204%201.7z%22%20fill%3D%22%23fff%22%3E%3C/path%3E%3C/svg%3E");';
      } else {
        bgImage = 'url("data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20viewBox%3D%220%200%2056%2064%22%3E%3Cpath%20d%3D%22m5.1%200c-2.8%200-5.1%202.3-5.1%205.1v53.8c0%202.8%202.3%205.1%205.1%205.1h45.8c2.8%200%205.1-2.3%205.1-5.1v-38.6l-18.9-20.3h-32z%22%20fill-rule%3D%22evenodd%22%20clip-rule%3D%22evenodd%22%20fill%3D%22%233C8CEA%22%3E%3C/path%3E%3Cpath%20d%3D%22m10.1%2037.4h21.6v2.1h-21.6z%20m0%204.8h21.6v2.1h-21.6z%20m0%204.8h21.6v2.1h-21.6z%20m0%204.8h12.3v2.1h-12.3z%22%20fill%3D%22%23fff%22%3E%3C/path%3E%3Cg%20fill-rule%3D%22evenodd%22%20clip-rule%3D%22evenodd%22%3E%3Cpath%20d%3D%22m56%2020.4v1h-12.8s-6.4-1.3-6.2-6.7c0%200%200.2%205.7%206%205.7h13z%22%20fill%3D%22%232D6FE4%22%3E%3C/path%3E%3Cpath%20d%3D%22m37.1%200v14.6c0%201.6%201.1%205.8%206.1%205.8h12.8l-18.9-20.4z%22%20opacity%3D%22.5%22%20fill%3D%22%23fff%22%3E%3C/path%3E%3C/g%3E%3C/svg%3E");';
      }

      let style = `<style>
                      div.bg {
                        padding: 10px 10px 10px 90px;height:100px;width:280px;
                        background-repeat:no-repeat;background-position:left center;background-size:80px 80px;
                        background-image:${bgImage};
                        margin-left:auto;
                        margin-right:auto;
                      }
                  </style>`;


      if (extension === 'gif') {
        content = `<div style="width:300px; margin-left:auto; margin-right:auto">
                    <img src="${document.querySelector('#noticeFile').value}" style="width:250px; height:130px;"/>
                  </div>`;
      }
      else {
        content = `${style}<div class="bg">
                    <div style="margin:10px 0 10px 0">${fileName}</div>
                    <div>${formatBytes(fileSize)}</div>
                  </div>`;
      }


    }
    else
      content = '';

    sdk.setContent(content);

    let zaloMsg = null;
    if (extension === 'gif') {
      zaloMsg = {
        'attachment': {
          'type': 'template',
          'payload': {
            'template_type': 'media',
            'elements': [
              {
                'media_type': 'gif',
                'url': el.value,
              }
            ]
          }
        }
      };
    }
    else {
      zaloMsg = {
        'attachment': {
          'type': 'file',
          'payload': {
            'token': ''
          }
        }
      };
    }

    sdk.setData({
      'type': messageType,
      'typeName': 'Consulting News File (PDF/DOCX/DOC)',

      'fileName': fileName,
      'fileType': extension,
      'fileSize': fileSize,
      'fileId': fileId,
      'u': {
        'notice-file': document.querySelector('#notice-file').value
      },
      'message': zaloMsg
    });
  }
  else if (messageType === 'communication') {
    let bannerImage = document.querySelector('#commBannerImage').value,
      headerText = document.querySelector('#txtCommHeader').value,
      headerAlign = document.querySelector('#lstHeaderAlignment').value,
      content1 = document.querySelector('#txtCommContent1').value,
      content1Align = document.querySelector('#lstContent1Alignment').value,
      content2Align = document.querySelector('#lstContent2Alignment').value,
      content2 = document.querySelector('#txtCommContent2').value;

    let buttonElements = [], buttonContents = [], elements = [], ui = [];

    let tableElement = {};
    let flag = false;

    document.querySelectorAll('#communication div.slds-form-element__row').forEach((el, index) => {
      if (el.matches('.buttonRow')) {
        let linkOrButton = el.querySelector('select.selectType').value;
        if (linkOrButton) {
          let title = el.querySelector('input.title').value;
          let e = {};
          e.title = title;

          if (linkOrButton === 'link') {
            let url = el.querySelector('input.link').value;
            e.type = 'oa.open.url';
            e.payload = {
              'url': url
            }
          }
          else if (linkOrButton === 'button') {
            let responseMessage = el.querySelector('input.responseMessage').value;
            e.type = 'oa.query.show';
            e.payload = responseMessage;
          }

          let linkImage = el.querySelector('select.linkImage').value;
          e.image_icon = linkImage;
          buttonElements.push(e);

          let currentContent = `<div style="padding:15px 5px 15px 70px;border-bottom:1px solid #EBEAE9; background-image: url(\'${linkImage}\');background-position: left center;background-repeat: no-repeat; background-size:40px 40px">
                                  ${title}
                              </div>`;

          buttonContents.push(currentContent);
        }
      }
      else if (el.matches('.bannerRow')) {
        elements.push({
          'type': 'banner',
          'image_url': el.querySelector('select.bannerImage').value
        });
      }
      else if (el.matches('.headerRow')) {
        elements.push({
          'type': 'header',
          'content': el.querySelector('#txtCommHeader').value,
          'align': el.querySelector('#lstHeaderAlignment').value
        });
      }
      else if (el.matches('.contentRow')) {
        let textContent = el.querySelector('textarea').value;

        if (textContent) {
          elements.push({
            'type': 'text',
            'content': textContent,
            'align': el.querySelector('select').value
          });
        }
      }
      else if (el.matches('.tableRow')) {
        let textKey = el.querySelector('input.key').value;
        if (textKey) {
          if (!flag) {
            tableElement = {
              'type': 'table',
              'content': [
                {
                  'key': textKey,
                  'value': el.querySelector('input.value').value
                }
              ]
            };
            elements.push(tableElement);
            flag = true;
          }
          else {
            tableElement.content.push({
              'key': textKey,
              'value': el.querySelector('input.value').value
            });
          }
        }
      }

      //Store the values for UI
      el.querySelectorAll('select, input, textarea').forEach(item => {
        let obj = { 'id': item.id, 'value': item.value };
        ui.push(obj);
      });
    });

    let content = `<style>
                      div.myrow::after {
                        clear:both;
                        content:"";
                        display:table
                      }
                   </style>
                  <div style="width:300px; margin-left:auto; margin-right:auto; font-weight:600">
                      <div style="padding:10px 0">
                        <svg fill="#000000" width="20px" height="20px" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg" style="margin-right:10px">
                          <path id="announcement" d="M997.7,276.689c4.562,1.118,11.424,3.839,19.778,10.381v-36.3c-8.354,6.54-15.216,9.262-19.778,10.381ZM990.676,293l-.057-.067-.068-.111c-.633-1.078-1.445-3.321-1.715-7.894l0-.026V279.7h-4.608l-2.611,0v16.36h7.32c.023,0,.049-.007.077-.008l.09-.01.13.008c.03,0,.057.005.079.009a1.869,1.869,0,0,0,1.822-1.862,1.833,1.833,0,0,0-.25-.906A1.891,1.891,0,0,0,990.676,293Zm-17.6-28.3v8.448a4.244,4.244,0,0,0,4.231,4.227h18.065v-16.9H977.309A4.242,4.242,0,0,0,973.078,264.7Zm49.969-19.193H1020.8a1.011,1.011,0,0,0-.995.995v44.844a1,1,0,0,0,.995.991h2.245a.994.994,0,0,0,.992-.993V246.495A1,1,0,0,0,1023.047,245.5Z" transform="translate(-973 -245)"/>
                        </svg>
                        <span>TIN TRUYỀN THÔNG</span>
                      </div>
                      <div id="banner"><img src="${bannerImage}" style="width:100%; height:200px;"/></div>
                      <div id="header" style="text-align:${headerAlign};padding-top:4px">${headerText}</div>
                      <div id="content1" style="text-align:${content1Align};font-weight:100;padding-top:5px">${content1}</div>
                      <div id="table" style="padding-top:10px">
                        <div class="myrow">
                          <div style="float:left;width:40%">${document.querySelector('#txtCommTableKey1').value}</div>    
                          <div style="float:left;width:60%">${document.querySelector('#txtCommTableValue1').value}</div>
                        </div>
                        <div class="myrow" style="padding-top:4px">
                          <div style="float:left;width:40%">${document.querySelector('#txtCommTableKey2').value}</div>
                          <div style="float:left;width:60%"> ${document.querySelector('#txtCommTableValue2').value}</div>
                        </div>
                        <div class="myrow" style="padding-top:4px">
                          <div style="float:left;width:40%">${document.querySelector('#txtCommTableKey3').value}</div>
                          <div style="float:left;width:60%">${document.querySelector('#txtCommTableValue3').value}</div>
                        </div>
                        <div class="myrow" style="padding-top:4px">
                          <div style="float:left;width:40%">${document.querySelector('#txtCommTableKey4').value}</div>
                          <div style="float:left;width:60%">${document.querySelector('#txtCommTableValue4').value}</div>
                        </div>
                        <div class="myrow" style="padding-top:4px">
                          <div style="float:left;width:40%">${document.querySelector('#txtCommTableKey5').value}</div>
                          <div style="float:left;width:60%">${document.querySelector('#txtCommTableValue5').value}</div>
                        </div>
                      </div>
                      <div id="content2" style="text-align:${content2Align};border-bottom:1px solid #EBEAE9;padding:6px 0;font-weight:100">${content2}</div>
                      <div id="buttons" style="padding-top:6px">${buttonContents.join('')}</div>
                  </div>`;

    sdk.setContent(content);
    sdk.setData({
      'type': messageType,
      'typeName': 'Media News - Communication',

      'u': ui,
      'message': {
        'attachment': {
          'type': 'template',
          'payload': {
            'template_type': 'promotion',
            'elements': elements,
            'buttons': buttonElements
          }
        }
      }
    });
  }
  else if (messageType === 'transaction') {
    const transactionMap = {
      'VI': {
        'transaction_billing': 'Hóa đơn',
        'transaction_order': 'Đơn hàng',
        'transaction_reward': 'Tích điểm',
        'transaction_contract': 'Hợp đồng',
        'transaction_booking': 'Lịch hẹn',
        'transaction_membership': 'Thành viên',
        'transaction_event': 'Sự kiện',
        'transaction_transaction': 'Giao dịch',
        'transaction_account': 'Tài khoản',
        'transaction_internal': 'Nội bộ',
        'transaction_partnership': 'Đối tác',
        'transaction_education': 'Học vụ',
        'transaction_rating': 'Đánh giá'
      },
      'EN': {
        'transaction_billing': 'Billing',
        'transaction_order': 'Order',
        'transaction_reward': 'Reward',
        'transaction_contract': 'Contract',
        'transaction_booking': 'Booking',
        'transaction_membership': 'Memebership',
        'transaction_event': 'Event',
        'transaction_transaction': 'Transaction',
        'transaction_account': 'Account',
        'transaction_internal': 'Internal',
        'transaction_partnership': 'Partnership',
        'transaction_education': 'Education',
        'transaction_rating': 'Rating'
      }
    }
    let bannerImage = document.querySelector('#transBannerImage').value,
      headerText = document.querySelector('#txttransHeader').value,
      headerAlign = document.querySelector('#lstTransHeaderAlignment').value,
      content1 = document.querySelector('#txttransContent1').value,
      content1Align = document.querySelector('#lstTransContent1Alignment').value,
      content2Align = document.querySelector('#lstTransContent2Alignment').value,
      content2 = document.querySelector('#txttransContent2').value,
      transLanguage = document.querySelector('#transLanguage').value,
      transMessageType = transLanguage === 'VI' ? 'Loại tin' : 'Message Type',
      transTypeKey = document.querySelector('#transType').value,
      transTypeLabel = transactionMap[transLanguage][transTypeKey],
      transTitle = transLanguage === 'VI' ? 'TIN GIAO DỊCH' : 'TRANSACTIONAL MESSAGE';

    let buttonElements = [], buttonContents = [], elements = [], ui = [];

    let tableElement = {};
    let flag = false;

    document.querySelectorAll('#transaction div.slds-form-element__row').forEach((el, index) => {
      if (el.matches('.buttonRow')) {
        let linkOrButton = el.querySelector('select.selectType').value;
        if (linkOrButton) {
          let title = el.querySelector('input.title').value;
          let e = {};
          e.title = title;

          if (linkOrButton === 'link') {
            let url = el.querySelector('input.link').value;
            e.type = 'oa.open.url';
            e.payload = {
              'url': url
            }
          }
          else if (linkOrButton === 'button') {
            let responseMessage = el.querySelector('input.responseMessage').value;
            e.type = 'oa.query.show';
            e.payload = responseMessage;
          }

          let linkImage = el.querySelector('select.linkImage').value;
          e.image_icon = linkImage;
          buttonElements.push(e);

          let currentContent = `<div style="padding:15px 5px 15px 70px;border-bottom:1px solid #EBEAE9; background-image: url(\'${linkImage}\');background-position: left center;background-repeat: no-repeat; background-size:40px 40px">
                                  ${title}
                              </div>`;

          buttonContents.push(currentContent);
        }
      }
      else if (el.matches('.bannerRow')) {
        elements.push({
          'type': 'banner',
          'image_url': el.querySelector('select.bannerImage').value
        });
      }
      else if (el.matches('.headerRow')) {
        elements.push({
          'type': 'header',
          'content': el.querySelector('#txttransHeader').value,
          'align': el.querySelector('#lstTransHeaderAlignment').value
        });
      }
      else if (el.matches('.contentRow')) {
        let textContent = el.querySelector('textarea').value;

        if (textContent) {
          elements.push({
            'type': 'text',
            'content': textContent,
            'align': el.querySelector('select').value
          });
        }
      }
      else if (el.matches('.tableRow')) {
        let textKey = el.querySelector('input.key').value;
        if (textKey) {
          if (!flag) {
            tableElement = {
              'type': 'table',
              'content': [
                {
                  'key': textKey,
                  'value': el.querySelector('input.value').value
                }
              ]
            };
            elements.push(tableElement);
            flag = true;
          }
          else {
            tableElement.content.push({
              'key': textKey,
              'value': el.querySelector('input.value').value
            });
          }
        }
      }

      //Store the values for UI
      el.querySelectorAll('select, input, textarea').forEach(item => {
        let obj = { 'id': item.id, 'value': item.value };
        ui.push(obj);
      });
    });

    let content = `<style>
                      div.myrow::after {
                        clear:both;
                        content:"";
                        display:table
                      }
                   </style>
                  <div style="width:300px; margin-left:auto; margin-right:auto; font-weight:600">
                      <div style="padding:10px 0">
                        <svg width="30px" height="30px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-right:10px">
                          <rect width="24" height="24" fill="white"/>
                          <path fill-rule="evenodd" clip-rule="evenodd" d="M9 11C8.44772 11 8 11.4477 8 12C8 12.5523 8.44772 13 9 13H15C15.5523 13 16 12.5523 16 12C16 11.4477 15.5523 11 15 11H9ZM9 14C8.44772 14 8 14.4477 8 15C8 15.5523 8.44772 16 9 16H15C15.5523 16 16 15.5523 16 15C16 14.4477 15.5523 14 15 14H9ZM12.482 1.99989C13.1608 1.99885 13.7632 1.99793 14.3196 2.2284C14.876 2.45887 15.3014 2.88551 15.7806 3.36624C16.7302 4.31875 17.6813 5.26983 18.6338 6.21942C19.1145 6.69867 19.5412 7.12401 19.7716 7.68041C20.0021 8.23682 20.0012 8.83926 20.0001 9.51807C19.9963 12.034 20 14.5499 20 17.0659C20.0001 17.9524 20.0001 18.7162 19.9179 19.3278C19.8297 19.9833 19.631 20.6117 19.1213 21.1214C18.6117 21.631 17.9833 21.8298 17.3278 21.9179C16.7161 22.0001 15.9523 22.0001 15.0658 22H8.9342C8.0477 22.0001 7.28388 22.0001 6.67221 21.9179C6.0167 21.8298 5.38835 21.631 4.87868 21.1214C4.36902 20.6117 4.17028 19.9833 4.08215 19.3278C3.99991 18.7162 3.99995 17.9524 4 17.0659L4.00001 7.00004C4.00001 6.97802 4 6.95607 4 6.93421C3.99995 6.04772 3.99991 5.28391 4.08215 4.67224C4.17028 4.01673 4.36902 3.38838 4.87869 2.87872C5.38835 2.36905 6.0167 2.17031 6.67221 2.08218C7.28387 1.99994 8.04769 1.99998 8.93418 2.00003C10.1168 2.0001 11.2994 2.00171 12.482 1.99989Z" fill="#323232"/>
                        </svg>
                        <span style="position:relative;top:-5px">${transTitle}</span>
                      </div>
                      <div id="banner"><img src="${bannerImage}" style="width:100%; height:200px;"/></div>
                      <div id="header" style="text-align:${headerAlign};padding-top:4px">${headerText}</div>
                      <div id="content1" style="text-align:${content1Align};font-weight:100;padding-top:5px">${content1}</div>
                      <div id="table" style="padding-top:10px">
                        <div class="myrow">
                          <div style="float:left;width:40%">${document.querySelector('#txttransTableKey1').value}</div>    
                          <div style="float:left;width:60%">${document.querySelector('#txttransTableValue1').value}</div>
                        </div>
                        <div class="myrow" style="padding-top:4px">
                          <div style="float:left;width:40%">${transMessageType}</div>    
                          <div style="float:left;width:60%">${transTypeLabel}</div>
                        </div>
                        <div class="myrow" style="padding-top:4px">
                          <div style="float:left;width:40%">${document.querySelector('#txttransTableKey2').value}</div>
                          <div style="float:left;width:60%"> ${document.querySelector('#txttransTableValue2').value}</div>
                        </div>
                        <div class="myrow" style="padding-top:4px">
                          <div style="float:left;width:40%">${document.querySelector('#txttransTableKey3').value}</div>
                          <div style="float:left;width:60%">${document.querySelector('#txttransTableValue3').value}</div>
                        </div>
                        <div class="myrow" style="padding-top:4px">
                          <div style="float:left;width:40%">${document.querySelector('#txttransTableKey4').value}</div>
                          <div style="float:left;width:60%">${document.querySelector('#txttransTableValue4').value}</div>
                        </div>
                        <div class="myrow" style="padding-top:4px">
                          <div style="float:left;width:40%">${document.querySelector('#txttransTableKey5').value}</div>
                          <div style="float:left;width:60%">${document.querySelector('#txttransTableValue5').value}</div>
                        </div>
                      </div>
                      <div id="content2" style="text-align:${content2Align};border-bottom:1px solid #EBEAE9;padding:6px 0;font-weight:100">${content2}</div>
                      <div id="buttons" style="padding-top:6px">${buttonContents.join('')}</div>
                  </div>`;

    sdk.setContent(content);
    sdk.setData({
      'type': messageType,
      'typeName': 'Trading News - Transaction',

      'u': ui,
      'message': {
        'attachment': {
          'type': 'template',
          'payload': {
            'template_type': transTypeKey,
            'language': transLanguage,
            'elements': elements,
            'buttons': buttonElements
          }
        }
      }
    });
  }
}

function validate() {
  let messageType = document.getElementById('messageType').value;
  if (messageType) {
    if (messageType === 'text-area') {
      if (!document.querySelector('#txtBlock1').value)
        document.querySelector('#txtBlock1').classList.add('slds-has-error');
      else
        document.querySelector('#txtBlock1').classList.remove('slds-has-error');
    }
    else if (messageType === 'form-photo') {
      document.querySelectorAll('#form-photo textarea, #form-photo select').forEach((el) => {
        if (!el.value)
          el.classList.add('slds-has-error');
        else
          el.classList.remove('slds-has-error');

      });
    }
    else if (messageType === 'user-info') {
      document.querySelectorAll('#user-info div.slds-form-element__row').forEach((el) => {
        el.querySelectorAll('input, select, textarea').forEach((inputEl) => {
          if (!inputEl.value)
            inputEl.classList.add('slds-has-error');
          else
            inputEl.classList.remove('slds-has-error');
        });
      });
    }
    else if (messageType === 'notice') {
      if (!document.querySelector('#notice-file').value)
        document.querySelector('#notice-file').classList.add('slds-has-error');
      else
        document.querySelector('#notice-file').classList.remove('slds-has-error');
    }
    else if (messageType === 'communication') {

      document.querySelectorAll('#communication .required').forEach((el, index) => {
        if (!el.value)
          el.classList.add('slds-has-error');
        else
          el.classList.remove('slds-has-error');
      });

      document.querySelectorAll('#communication div.buttonRow').forEach((el, index) => {
        let linkOrButton = el.querySelector('select.selectType').value;

        if (linkOrButton) {
          if (linkOrButton === 'link') {
            el.querySelectorAll('input.title, input.link').forEach((inputEl) => {
              if (!inputEl.value)
                inputEl.classList.add('slds-has-error');
              else
                inputEl.classList.remove('slds-has-error');
            });
          }
          else if (linkOrButton === 'button') {
            el.querySelectorAll('input.title, input.responseMessage ').forEach((inputEl) => {
              if (!inputEl.value)
                inputEl.classList.add('slds-has-error');
              else
                inputEl.classList.remove('slds-has-error');
            });
          }
        }
        else {
          el.querySelectorAll('input.title, input.responseMessage, input.link').forEach((inputEl) => {
            inputEl.classList.remove('slds-has-error');
          });
        }

      });
    }
    else if (messageType === 'transaction') {
      document.querySelectorAll('#transaction .required').forEach((el, index) => {
        if (!el.value)
          el.classList.add('slds-has-error');
        else
          el.classList.remove('slds-has-error');
      });

      document.querySelectorAll('#transaction div.buttonRow').forEach((el, index) => {
        let linkOrButton = el.querySelector('select.selectType').value;

        if (linkOrButton) {
          if (linkOrButton === 'link') {
            el.querySelectorAll('input.title, input.link').forEach((inputEl) => {
              if (!inputEl.value)
                inputEl.classList.add('slds-has-error');
              else
                inputEl.classList.remove('slds-has-error');
            });
          }
          else if (linkOrButton === 'button') {
            el.querySelectorAll('input.title, input.responseMessage ').forEach((inputEl) => {
              if (!inputEl.value)
                inputEl.classList.add('slds-has-error');
              else
                inputEl.classList.remove('slds-has-error');
            });
          }
        }
        else {
          el.querySelectorAll('input.title, input.responseMessage, input.link').forEach((inputEl) => {
            inputEl.classList.remove('slds-has-error');
          });
        }
      });

      const transLanguage = document.querySelector('#transLanguage').value;
      const firstEl = document.querySelector('#txttransTableKey1');
      if (transLanguage === 'VI') {
        if (firstEl.value.trim() !== 'Tên khách hàng' && !firstEl.value.trim().startsWith('Mã'))
          firstEl.classList.add('slds-has-error');
        else
          firstEl.classList.remove('slds-has-error');
      }
      else { //English
        if (firstEl.value.trim() !== 'Customer Name' && !firstEl.value.trim().includes('Code'))
          firstEl.classList.add('slds-has-error');
        else
          firstEl.classList.remove('slds-has-error');
      }
    }
  }
}

//Capture event on the UI
document.getElementById('workspace').addEventListener("input", function () {
  paint(document.querySelector('#messageType').value);
});

//Document ready
document.addEventListener('DOMContentLoaded', function (event) {
  restoreParms();
});

