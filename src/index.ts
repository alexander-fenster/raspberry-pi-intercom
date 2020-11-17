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

import {start, stop, getHttpStream} from './http';
import {services} from './services';
import {uuid, recordingTimeout} from './constants';
import {initButton, stopPollingButton} from './gpio';
import {
  getPlayAudioStream,
  startMicrophoneRecording,
  stopMicrophoneRecording,
} from './audio';

process.on('SIGINT', () => {
  stopPollingButton();
  stop();
  throw new Error('SIGINT caught, exiting.');
});

function getStreams() {
  const streams: NodeJS.WritableStream[] = [];
  for (const hostname in services) {
    if (!services[hostname]) {
      continue;
    }
    if (services[hostname] === uuid) {
      continue;
    }
    streams.push(getHttpStream(hostname));
  }
  return streams;
}

let recordingTimer: NodeJS.Timeout | null = null;

function startRecording() {
  if (recordingTimer) {
    clearTimeout(recordingTimer);
  }
  recordingTimer = setTimeout(stopRecording, recordingTimeout);
  const streams = getStreams();
  startMicrophoneRecording(streams);
  console.log(`${new Date()}: started recording for ${streams.length} streams`);
}

function stopRecording() {
  if (recordingTimer) {
    clearTimeout(recordingTimer);
  }
  stopMicrophoneRecording();
  console.log(`${new Date()}: stopped recording`);
}

async function receivedAudio() {
  console.log(`${new Date()}: received audio`);
  return await getPlayAudioStream();
}

async function main() {
  start(receivedAudio);
  initButton(startRecording, stopRecording);
}

main();
