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

import {v4 as uuidv4} from 'uuid';

// Our unique ID
export const uuid = uuidv4();

// HTTP and mDNS settings
export const port = 4242;
export const mdnsType = 'rpi-intercom';

// HTTP paths and header
export const idPath = '/id';
export const intercomPath = '/intercom';
export const debugPath = '/debug';
export const idHeader = 'x-origin-id';

// GPIO settings for the button
export const gpioPin = 40;

// Audio recording settings
export const recordDevice = 'sysdefault:CARD=Device';
export const recordingTimeout = 10000;

// Chime sound. Not included in the distribution, use any short *.wav
export const chimeWav = './chime.wav';
