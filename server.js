const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const PAGE_ACCESS_TOKEN = 'EAADjZCCRtF8cBAFb9TlKh2U4rggNdGUGvZBPASVUbMGQTKiKoJamWa2RvzveMNhgRtWqrjU51dPlHXpb3afoMWXWZAVr7QozjBinnL3KPc25bY0ecknmVVTzIEAMt4cUUgRac1A41ZCfUet64N2LkYq5mrYMm20ZCp5JlF9PjoAZDZD';
const API_AI_TOKEN = '0f9842062bbb4b85a5bd4e91f1c4c21d';
const apiaiApp  = require('apiai')(API_AI_TOKEN);
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

/* For Facebook Validation */
app.get('/', (req, res) => {
  if (req.query['hub.mode'] && req.query['hub.verify_token'] === 'laurealim') {
    res.status(200).send(req.query['hub.challenge']);
  } else {
    res.status(403).end();
  }
});

/* Handling all messenges */
app.post('/', (req, res) => {
  console.log(req.body);
  if (req.body.object === 'page') {
    req.body.entry.forEach((entry) => {
      entry.messaging.forEach((event) => {
        if (event.message && event.message.text) {
          sendMessage(event);
        }
      });
    });
    res.status(200).end();
  }
});

function sendMessage(event) {
  let sender = event.sender.id;
  let text = event.message.text;

  let apiai = apiaiApp.textRequest(text, {
    sessionId: 'laurealim' // use any arbitrary id
  });

  apiai.on('response', (response) => {
    let aiText = response.result.fulfillment.speech;
    request({
      url: 'https://graph.facebook.com/v2.6/me/messages',
      qs: {access_token: PAGE_ACCESS_TOKEN},
      method: 'POST',
      json: {
        recipient: {id: sender},
        message: {text: aiText}
      }
    }, (error, response) => {
      if (error) {
          console.log('Error sending message: ', error);
      } else if (response.body.error) {
          console.log('Error: ', response.body.error);
      }
    });
  });

  apiai.on('error', (error) => {
    console.log(error);
  });

  apiai.end();
}

const server = app.listen(process.env.PORT || 5000, () => {
  console.log('Express server listening on port %d in %s mode', server.address().port, app.settings.env);
});
