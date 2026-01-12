const mc = require('./mc');
const config = require('../config');
const logger = require('./logger');

const webhook = {};

webhook.processRequest = async (req, res) => {

  const event = req.body;

  if (process.env.DEBUG_LOG)
    logger.info(JSON.stringify(event));

  try {
    switch (event.event_name) {
      case 'follow':
      case 'unfollow':

        const obj = {
          'Zalo_ID': event.follower.id,
          'Status': event.event_name,
          'Zalo_ID_By_App': event.user_id_by_app
        };

        let attr = (event.event_name.toUpperCase() == 'FOLLOW') ? 'Subscribe_Date' : 'Unsubscribe_Date';

        const d = new Date(parseInt(event.timestamp));
        obj[attr] = d.toISOString();

        mc.upsertDERow(config.sfmc.subDeName, obj)
          .catch(err => { logger.error(`[Exception in webhook - Follow/Unfollow] ${err}`) });
        break;

      case 'user_received_message':

        if (event.message.delivery_time) { //ZNS

          const deliveryDate = new Date(parseInt(event.message.delivery_time));

          mc.upsertDERow(config.sfmc.logDeName,
            {
              'Message_ID': event.message.msg_id,
              // 'Sender_ID': event.sender.id,
              'User_ID_By_App': event.user_id_by_app,
              'App_ID': event.app_id,
              'Delivery_Status': true,
              'Delivery_Date': deliveryDate.toISOString(),
            }
          ).catch(err => { logger.error(`[Exception in webhook - user_received_message] ${err}`) });
        }
        else { //OA
          const deliveryDate = new Date(parseInt(event.timestamp))

          mc.upsertDERow(config.sfmc.logDeName,
            {
              'Message_ID': event.message.msg_id,
              'Sender_ID': event.sender.id,
              'User_ID_By_App': event.user_id_by_app,
              'App_ID': event.app_id,
              'Delivery_Status': true,
              'Delivery_Date': deliveryDate.toISOString(),
            }
          ).catch(err => { logger.error(`[Exception in webhook - user_received_message] ${err}`) });

        }
        break;

      case 'user_seen_message':
        for (let i = 0; i < event.message.msg_ids.length; i++) {
          const seenDate = new Date(parseInt(event.timestamp));
          mc.upsertDERow(config.sfmc.logDeName,
            {
              'Message_ID': event.message.msg_ids[i],
              'Seen_Status': true,
              'Seen_Date': seenDate.toISOString(),
            }
          ).catch(err => { logger.error(`[Exception in webhook - user_received_message] ${err}`) });

        }
        break;

      case 'user_submit_info':
        if (event.error_message) logger.error(`[Exception in webhook - user_submit_info] ${event.error_message}`)
        mc.upsertDERow(config.sfmc.subDeName,
          {
            'Zalo_ID': event.sender.id,
            'Address': event.info.user_address,
            'Phone': event.info.phone,
            'City': event.info.user_city,
            'District': event.info.district,
            'Name': event.info.name,
            'Ward': event.info.user_ward,
          }
        ).catch(err => { logger.error(`[Exception in webhook - user_submit_info] ${err}`) });

        break;
    }
  }
  catch (err) {
    logger.error(`[Exception in webhook] ${err}`);
  }
}

module.exports = webhook; 