// Copyright 2020 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import * as http from 'http';
import * as mdns from 'mdns';
import {
  port,
  idPath,
  intercomPath,
  debugPath,
  mdnsType,
  uuid,
  idHeader,
} from './constants';
import {
  registerService,
  services,
  servicesSet,
  unregisterService,
} from './services';

let mdnsAdvertisement: mdns.Advertisement;
let mdnsBrowser: mdns.Browser;
let savedAudioCallback: () => Promise<NodeJS.WritableStream>;

function debugInfo() {
  const result = {
    services,
    servicesSet: [] as string[],
  };
  for (const key of servicesSet.keys()) {
    result.servicesSet.push(key);
  }
  return JSON.stringify(result, null, '  ') + '\r\n';
}

const server = http.createServer((req, res) => {
  // do we know the origin of the request?
  const theirId = req.headers[idHeader] as string | undefined;
  console.log(
    `${new Date()}: got incoming http request to ${req.url} from ${theirId}`
  );
  if (theirId && !servicesSet.has(theirId)) {
    let host = req.headers.host;
    if (host) {
      host = host.replace(/:\d+$/, '');
      console.log(
        `${new Date()}: request from unknown id ${theirId}, host ${host}, registering`
      );
      const service = {
        name: host,
        type: {
          name: mdnsType,
        },
      };
      registerService(service as mdns.Service);
    }
  }

  switch (req.url) {
    case intercomPath:
      processRequest(req, res);
      break;
    case idPath:
      res.end(uuid + '\r\n');
      break;
    case debugPath:
      res.end(debugInfo());
      break;
    default:
      res.statusCode = 404;
      res.end('Not found\r\n');
  }
});

server.on('clientError', (err, socket) => {
  if (err.code === 'ECONNRESET' || !socket.writable) {
    return;
  }
  socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
});

export function stop() {
  mdnsAdvertisement.stop();
  mdnsBrowser.stop();
}

export function getHttpStream(hostname: string) {
  const headers: {[header: string]: string} = {
    'content-type': 'application/octet-stream',
    connection: 'keep-alive',
  };
  headers[idHeader] = uuid;
  const post = http.request({
    hostname,
    port,
    path: intercomPath,
    method: 'POST',
    headers,
  });
  post.on('error', err => {
    console.error('getHttpStream HTTP error:', err);
  });
  return post;
}

async function processRequest(
  req: http.IncomingMessage,
  res: http.ServerResponse
) {
  const stream = await savedAudioCallback();
  req.on('data', (chunk: Buffer) => {
    stream.write(chunk);
  });
  req.on('end', () => {
    stream.end();
    res.end('OK');
  });
  req.on('error', err => {
    console.error('processRequest HTTP error:', err);
  });
}

export async function start(
  audioCallback: () => Promise<NodeJS.WritableStream>
) {
  savedAudioCallback = audioCallback;

  // 1. Start listening
  server.listen(port);

  // 2. Advertize ourselves on mdns
  const mdnsServiceType = new mdns.ServiceType({
    name: mdnsType,
    protocol: 'tcp',
  });
  mdnsAdvertisement = mdns.createAdvertisement(mdnsServiceType, port, {
    networkInterface: 'wlan0',
  });
  mdnsAdvertisement.on('error', err => {
    console.error('mdns error:', err);
  });
  mdnsAdvertisement.start();

  // 3. Browse for others
  const resolverSequence = [
    (service: mdns.Service, next: () => void) => {
      registerService(service);
      next();
      return true;
    },
  ];
  mdnsBrowser = mdns.createBrowser(mdnsServiceType, {
    networkInterface: 'wlan0',
    resolverSequence,
  });
  mdnsBrowser.on('serviceUp', service => {
    registerService(service);
  });
  mdnsBrowser.on('serviceDown', service => {
    unregisterService(service);
  });
  mdnsBrowser.on('error', (err: Error) => {
    console.error('mdns browser error:', err);
  });
  mdnsBrowser.start();
}
