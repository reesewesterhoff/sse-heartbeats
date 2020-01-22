// 'use strict';

const Hapi = require('@hapi/hapi');
// const http2 = require('http2')
const fs = require('fs');
const stream = require('stream')
const Path = require('path');

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
    // routes: {
    //   files: {
    //     relativeTo: Path.join(__dirname, 'public')
    //   }
    // }
  });

  // await server.register(require('@hapi/inert'));

  // server.route({
  //   method: 'GET',
  //   path: '/{param*}',
  //   handler: {
  //     directory: {
  //       path: '.',
  //       redirectToSlash: true
  //     }
  //   }
  // });

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
    options: {
      cors: true
    },
    handler: (request, h) => {
      console.log('ping endpoint hit');
      sleep(25000);

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
      console.log('hb hit')
      const channel = new stream.PassThrough();

      async function writeData() {
        await sleep(10000);
        channel.write('data:' + '<<<DATA>>>' + '\n\n');
      }

      setInterval(() => {
        channel.write('event: heartbeat\n');
        channel.write('data: \n\n');
      }, 1000);

      writeData();

      // return h.response(channel).type('text/event-stream');
      return h.response(channel).type('text/event-stream').header('Content-Encoding', 'identity');
    }
  });

  server.route({
    method: 'GET',
    path: '/nhbspace',
    options: {
      cors: true
    },
    handler: async (request, h) => {
      const channel = new stream.PassThrough();
      console.log('nhbspace hit')

      async function writeData() {
        let interval = setInterval(() => {
          channel.write(' ')
        }, 25000);
        await sleep(120000);
        clearInterval(interval);
        channel.write('data string');
        channel.end();
      }

      writeData();

      // return h.response(channel).type('text/event-stream');
      return channel
    }
  });

  server.route({
    method: 'GET',
    path: '/nhbnospace',
    options: {
      cors: true
    },
    handler: async (request, h) => {
      const channel = new stream.PassThrough();

      async function writeData() {
        let interval = setInterval(() => {
          channel.write('')
        }, 10000);
        await sleep(60000);
        clearInterval(interval);
        channel.write('data string');
        channel.end();
      }

      writeData();

      // return h.response(channel).type('text/event-stream');
      return channel
    }
  });

  server.events.on('request', (request, event, tags) => {
    console.log('Request:', request);
    console.log('Event:', event);
    console.log('Tags:', tags);
    if (tags.request && tags.abort && tags.error) {
      console.log(`Client aborted connection (${request.info.id})`);
    }
  });

  server.events.on('response', (request) => {
    console.log(`Response sent (${request.info.id})`);
  });

  server.events.on('log', (event, tags) => {
    console.log('Log event hit', event, tags)
  })

  await server.start();
  console.log(`Server running on ${server.info.uri}`);
};

process.on('unhandledRejection', (err) => {
  console.log(err);
  process.exit(1);
});

init();