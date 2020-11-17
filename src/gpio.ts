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

import * as rpio from 'rpio';
import {gpioPin} from './constants';

export function initButton(pressed: () => void, released: () => void) {
  rpio.open(gpioPin, rpio.INPUT, rpio.PULL_UP);
  rpio.poll(gpioPin, cbpin => {
    const state = rpio.read(cbpin) ? 'released' : 'pressed';
    if (state === 'released') {
      released();
    } else {
      pressed();
    }
  });
}

export function stopPollingButton() {
  rpio.poll(gpioPin, null);
  rpio.close(gpioPin);
}
