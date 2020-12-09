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

import * as cp from 'child_process';
import * as fs from 'fs';

import {recordDevice, chimeWav} from './constants';

let microphoneProcess: cp.ChildProcess | null = null;
let startRequested = false;

export async function startMicrophoneRecording(
  streams: NodeJS.WritableStream[]
) {
  startRequested = true;
  await chime();
  if (!startRequested) {
    // the button was pressed and immediately released, do nothing
    streams.forEach(stream => {
      stream.end();
    });
    return;
  }
  if (microphoneProcess) {
    stopMicrophoneRecording();
  }
  microphoneProcess = cp.spawn('arecord', ['-D', recordDevice]);
  microphoneProcess.stdout?.on('data', (data: Buffer) => {
    streams.forEach(stream => {
      stream.write(data);
    });
  });
  microphoneProcess.stdout?.on('close', () => {
    streams.forEach(stream => {
      stream.end();
    });
  });
}

export function stopMicrophoneRecording() {
  // prevent race condition during playing the chime
  startRequested = false;
  if (!microphoneProcess) {
    return;
  }
  microphoneProcess.kill();
  microphoneProcess = null;
}

export async function getPlayAudioStream() {
  await chime();
  const subprocess = cp.spawn('aplay');
  return subprocess.stdin;
}

function chime() {
  if (!chimeWav || !fs.existsSync(chimeWav)) {
    return Promise.resolve();
  }
  return new Promise(resolve => {
    const aplay = cp.spawn('aplay', [chimeWav]);
    aplay.on('exit', resolve);
  });
}
