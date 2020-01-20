'use strict';

const Hapi = require('@hapi/hapi');
// const http2 = require('http2')
const fs = require('fs');
const stream = require('stream')

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const init = async () => {
  // const http2Server = http2.createSecureServer({
  //   key: fs.readFileSync('localhost-privkey.pem'),
  //   cert: fs.readFileSync('localhost-cert.pem')
  // });

  const server = Hapi.server({
    // listener: http2Server,
    port: process.env.PORT || 3000,
    // host: 'localhost'
  });

  server.route({
    method: 'GET',
    path: '/',
    handler: (request, h) => {
      return 'Hello World!';
    }
  });

  server.route({
    method: 'GET',
    path: '/ping',
    handler: (request, h) => {
      console.log(h);
      return 'pong!';
    }
  });

  server.route({
    method: 'GET',
    path: '/sse',
    options: {
      cors: true
    },
    handler: async (request, h) => {
      console.log(`Client connected (${request.info.id})`);
      await sleep(10000);
      return h.response('data:' + '<<<DATA>>>' + '\n\n').type('text/event-stream');
    }
  });

  server.route({
    method: 'GET',
    path: '/sse2',
    options: {
      cors: true
    },
    handler: async (request, h) => {
      console.log(`Client connected (${request.info.id})`);

      let channel = new stream.PassThrough();

      async function writeData() {
        channel.write('data:' + '<<<DATA1>>>' + '\n\n');
        await sleep(5000);
        channel.write('data:' + '<<<DATA2>>>' + '\n\n');
      }

      writeData();

      return h.response(channel).type('text/event-stream').header('Content-Encoding', 'identity');
      // return h.response(channel).code(200).type('text/event-stream').header('Content-Encoding', 'identity');
    }
  });

  server.route({
    method: 'GET',
    path: '/hb',
    options: {
      cors: true
    },
    handler: async (request, h) => {
      const channel = new stream.PassThrough();

      async function writeData() {
        await sleep(60000);
        channel.write('data:' + '<<<DATA>>>' + '\n\n');
      }

      setInterval(() => {
        channel.write('event: heartbeat\n');
        channel.write('data: \n\n');
      }, 5000);

      writeData();

      // return h.response(channel).type('text/event-stream');
      return h.response(channel).type('text/event-stream').header('Content-Encoding', 'identity');
    }
  });

  server.route({
    method: 'GET',
    path: '/nhb',
    options: {
      cors: true
    },
    handler: async (request, h) => {
      const channel = new stream.PassThrough();

      async function writeData() {
        await sleep(60000);
        channel.write('data string');
      }

      setInterval(() => {
        channel.write(' ');
      }, 5000);

      writeData();

      // return h.response(channel).type('text/event-stream');
      return h.response(channel);
    }
  });

  server.events.on('request', (request, event, tags) => {
    // console.log(request);
    // console.log(event);
    // console.log(tags);
    if (tags.request && tags.abort && tags.error) {
      console.log(`Client aborted connection (${request.info.id})`);
    }
  });

  server.events.on('response', (request) => {
    console.log(`Response sent (${request.info.id})`);
  });

  await server.start();
  console.log(`Server running on ${server.info.uri}`);
};

process.on('unhandledRejection', (err) => {
  console.log(err);
  process.exit(1);
});

init();