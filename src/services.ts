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
import {port, idPath, mdnsType, uuid, idHeader} from './constants';

export const services: {[name: string]: string} = {};
export const servicesSet = new Set<string>();

function getId(hostname: string): void {
  const headers: {[header: string]: string} = {};
  headers[idHeader] = uuid;
  http
    .request(
      {
        hostname,
        port,
        path: idPath,
        method: 'GET',
        headers,
      },
      res => {
        let data = '';
        res.on('data', chunk => {
          data += chunk;
        });
        res.on('end', () => {
          const id = data.replace(/[\r\n]/g, '');
          if (hostname in services) {
            const oldId = services[hostname];
            if (oldId !== id) {
              console.log(
                `${new Date()}: service ${hostname} previously registered with id ${oldId}, removing`
              );
              delete services[hostname];
              servicesSet.delete(oldId);
            }
          }
          if (servicesSet.has(id)) {
            for (const oldHostname in services) {
              if (services[oldHostname] === id && oldHostname !== hostname) {
                console.log(
                  `${new Date()}: service with id ${id} previously registered as ${oldHostname}, removing`
                );
                delete services[oldHostname];
                servicesSet.delete(id);
                break;
              }
            }
          }
          console.log(
            `${new Date()}: register service ${hostname} with id ${id}`
          );
          services[hostname] = id;
          servicesSet.add(id);
        });
      }
    )
    .on('error', () => {})
    .end();
}

export function registerService(service: mdns.Service) {
  const name = service.name;
  const type = service.type.name;
  if (!name) {
    return;
  }
  if (type !== mdnsType) {
    return;
  }
  getId(name);
}

export function unregisterService(service: mdns.Service) {
  const name = service.name;
  const type = service.type.name;
  if (!name) {
    return;
  }
  if (type !== mdnsType) {
    return;
  }
  if (name in services) {
    const id = services[name];
    console.log(`${new Date()}: unregister service ${name} with id ${id}`);
    delete services[name];
    servicesSet.delete(id);
  }
}
