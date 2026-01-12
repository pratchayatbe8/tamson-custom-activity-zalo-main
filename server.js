/**
 * ============================================================================
 * Express Server Setup
 * ============================================================================
 */

const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const bodyParser = require('body-parser');
dotenv.config();
const app = express();
const customContentBlockRouter = require('./custom-content-block/custom_content_block_routes');
const webhook = require('./modules/webhook');
const axios = require('axios')
const zalo = require('./modules/zalo')
const util = require('./modules/util')
const controller = require('./custom-activity/custom_activity_controller')

const zaloRouter = express.Router(); // <--- ADD THIS LINE
// --------------------------- Middleware ---------------------------

// Parse incoming requests
zaloRouter.use(bodyParser.raw({ type: 'application/jwt' })); // For JWT payloads
zaloRouter.use(express.json());
zaloRouter.use(express.urlencoded({ extended: true }));
zaloRouter.use(express.text());
// --------------------------- Static Assets ------------------------
zaloRouter.use('/slds', express.static(path.join(__dirname, 'node_modules/@salesforce-ux/design-system/assets')));
zaloRouter.use('/images', express.static(path.join(__dirname, 'images')));
zaloRouter.use(express.static(path.join(__dirname, 'public')));
zaloRouter.use(express.static(path.join(__dirname, 'publicFiles')));

// --------------------------- View Engine --------------------------
zaloRouter.set('view engine', 'ejs');

// --------------------------- Routes -------------------------------
const customActivityRouter = require('./custom-activity/custom_activity_routes');
zaloRouter.use('/custom-activity', customActivityRouter);
zaloRouter.use('/custom-content-block', customContentBlockRouter);

// Health Check Endpoint
zaloRouter.get('/health', (req, res) => res.status(200).send('OK ZALO\n'));

//This is use for Zalo registration domain
zaloRouter.get('/', (req, res)=> {
    res.send('<html><head><meta name="zalo-platform-site-verification" content="NVxbSfRASoH6tAS7jDHqKMhUqsY6g0SsDJOv" /></head><body></body></html>');
  });
zaloRouter.get('/zalo_verifierNVxbSfRASoH6tAS7jDHqKMhUqsY6g0SsDJOv.html', (req, res) => {
  res.sendFile(
    path.join(__dirname, 'public/js', 'zalo_verifierNVxbSfRASoH6tAS7jDHqKMhUqsY6g0SsDJOv.html')
  );
});
  
zaloRouter.post('/webhook', (req, res) => {
  webhook.processRequest(req, res);
  res.sendStatus(200);
})


zaloRouter.post('/zaloTemplates', async (req, res) => {
  try {
    const token = req.body.Access_Token;
    const oaId = req.body.oaId;

    if (!token || !oaId) {
      return res.status(200).send({
        oaId,
        error: 1,
        message: 'Missing Access_Token or oaId',
        data: [],
        metadata: { total: 0 }
      });
    }

    const templates = await zalo.getZNSTemplates(token);
    // console.error('/zaloTemplates templates:', templates);

    return res.status(200).send({
      oaId,
      error: templates.data.error,
      message: templates.data.message,
      data: templates.data.data || [],
      metadata: templates.data.metadata || { total: 0 }
    });

  } catch (err) {
    console.error('/zaloTemplates fatal:', err);
    return res.status(200).send({
      oaId: req.body?.oaId || 'UNKNOWN',
      error: 999,
      message: 'Unhandled server error',
      data: [],
      metadata: { total: 0 }
    });
  }
});


zaloRouter.post('/mcTemplates', async (req, res) => {
  try {
    const contentBlocks = await controller.getCustomContentBlocks();

    return res.status(200).send({
      error: 0,
      message: 'OK',
      data: contentBlocks.items || [],
      metadata: {
        total: contentBlocks.count || 0,
        page: contentBlocks.page,
        pageSize: contentBlocks.pageSize
      }
    });

  } catch (err) {
    console.error('/mcContentBlocks fatal:', err);
    return res.status(200).send({
      error: 999,
      message: 'Unhandled server error',
      data: [],
      metadata: { total: 0 }
    });
  }
});


/**
 * ============================================================================
 * Deployment
 * ============================================================================
 */

app.use('/zalo', zaloRouter);

const port = process.env.PORT || 3000;

// --------------------------- local -------------------------------
app.listen(port, () => {console.log(`Server is listening on port ${port}`);});
// --------------------------- server -------------------------------
// module.exports = app;
