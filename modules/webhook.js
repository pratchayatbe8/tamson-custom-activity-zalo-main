const mc = require('./mc');
const config = require('../config');
const logger = require('./logger');

const webhook = {};

webhook.processRequest = async (req, res) => {
  const receivedAt = new Date().toISOString();

  try {
    const event = req.body;

    /* ---------------------------------
       1. Validate request body
    ----------------------------------*/
    if (!event || typeof event !== 'object') {
      logger.warn('[Webhook] Invalid or empty request body');
      return res.status(400).json({ message: 'Invalid request body' });
    }

    /* ---------------------------------
       2. Debug logging
    ----------------------------------*/
    if (process.env.DEBUG_LOG === 'true') {
      logger.info(`[Webhook] Payload: ${JSON.stringify(event)}`);
    }

    if (!event.event_name) {
      logger.warn('[Webhook] Missing event_name');
      return res.status(400).json({ message: 'Missing event_name' });
    }

    /* ---------------------------------
       3. Handle events
    ----------------------------------*/
    switch (event.event_name) {

      /* ---------- FOLLOW / UNFOLLOW ---------- */
      case 'follow':
      case 'unfollow': {
        if (!event.follower?.id || !event.user_id_by_app || !event.timestamp) {
          logger.warn('[Webhook] Missing follow/unfollow fields');
          return res.status(400).json({ message: 'Missing required fields' });
        }

        const isFollow = event.event_name === 'follow';
        const actionDate = new Date(Number(event.timestamp)).toISOString();

        const payload = {
          Zalo_ID: event.follower.id,
          Status: event.event_name,
          Zalo_ID_By_App: event.user_id_by_app,
          [isFollow ? 'Subscribe_Date' : 'Unsubscribe_Date']: actionDate
        };

        await mc.upsertDERow(config.sfmc.subDeName, payload);

        return res.status(200).json({ message: 'Follow event processed' });
      }

      /* ---------- USER RECEIVED MESSAGE ---------- */
      case 'user_received_message': {
        if (!event.message?.msg_id || !event.user_id_by_app || !event.app_id) {
          logger.warn('[Webhook] Missing user_received_message fields');
          return res.status(400).json({ message: 'Missing required fields' });
        }

        const deliveryTime = event.message.delivery_time || event.timestamp;
        const deliveryDate = new Date(Number(deliveryTime)).toISOString();

        const payload = {
          Message_ID: event.message.msg_id,
          User_ID_By_App: event.user_id_by_app,
          App_ID: event.app_id,
          Delivery_Status: true,
          Delivery_Date: deliveryDate
        };

        if (event.sender?.id) {
          payload.Sender_ID = event.sender.id;
        }

        await mc.upsertDERow(config.sfmc.logDeName, payload);

        return res.status(200).json({ message: 'Message delivery processed' });
      }

      /* ---------- USER SEEN MESSAGE ---------- */
      case 'user_seen_message': {
        if (!Array.isArray(event.message?.msg_ids) || !event.timestamp) {
          logger.warn('[Webhook] Invalid seen message payload');
          return res.status(400).json({ message: 'Invalid seen message payload' });
        }

        const seenDate = new Date(Number(event.timestamp)).toISOString();

        for (const msgId of event.message.msg_ids) {
          await mc.upsertDERow(config.sfmc.logDeName, {
            Message_ID: msgId,
            Seen_Status: true,
            Seen_Date: seenDate
          });
        }

        return res.status(200).json({ message: 'Seen event processed' });
      }

      /* ---------- USER SUBMIT INFO ---------- */
      case 'user_submit_info': {
        if (!event.sender?.id || !event.info) {
          logger.warn('[Webhook] Invalid user_submit_info payload');
          return res.status(400).json({ message: 'Invalid submit info payload' });
        }

        if (event.error_message) {
          logger.error(`[Webhook] user_submit_info error: ${event.error_message}`);
        }

        const payload = {
          Zalo_ID: event.sender.id,
          Phone: event.info.phone || null,
          Name: event.info.name || null
        };

        await mc.upsertDERow(config.sfmc.subDeName, payload);

        return res.status(200).json({ message: 'User info updated' });
      }

      /* ---------- UNKNOWN EVENT ---------- */
      default:
        logger.info(`[Webhook] Unsupported event_name: ${event.event_name}`);
        return res.status(200).json({ message: 'Event ignored' });
    }

  } catch (err) {
    logger.error(`[Webhook] Unhandled exception: ${err?.message || err}`);
    return res.status(500).json({ message: 'Internal server error' });
  }
};


module.exports = webhook; 