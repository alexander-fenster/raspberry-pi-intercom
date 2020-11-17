# Intercom for multiple Raspberry Pi in the same network

## Purpose

I want to be able to talk to the people in other rooms just by pressing a
button.  It's a fun weekend project. Might be useful for the cases where
several people in the family work from home sitting in different rooms with
closed doors.  My experience shows that pressing an intercom button on a
solderless breadboard is much more fun than shouting!

## Setup

- 2 (or more) Raspberry Pis with some kind of microphone and speaker connected.
  Both should work with ALSA. Basically, `arecord` and `aplay` commands should
  work. For `arecord`, you can pass the specific device name (`-D` option, see
  `src/constants.ts`). For `aplay`, the code expects the default device to work
  (adding `-D` option in a similar way won't be hard if you need it).

- A button connected to GPIO pin 40 (`GPIO21`). Acts as push-to-talk button.
  The pin number is configurable in `src/constants.ts`.

- All Pis should be in the same network since the code relies on mDNS to work.
  Avahi daemon should be on (it's on by default in Raspbian).

- The code uses [`rpio`](https://www.npmjs.com/package/rpio) Node.js package.
  Follow their
  [requirements](https://www.npmjs.com/package/rpio#important-system-requirements)
  to setup your Raspberry Pis.

- The `./chime.wav` mentioned in `src/constants.ts` is played when a button is
  pressed, and when a message is received. It's not included, but you can make
  one for yourself, e.g. by taking one of the Freedesktop OGG files and
  converting it:  
  `ffmpeg -i /usr/share/sounds/freedesktop/stereo/message-new-instant.oga -t 0.6 chime.wav`

## Usage

On all Raspberry Pis connected to the same network:

```sh
$ npm install
$ npm start
```

Enjoy your intercom!

## Implementation details

Written in TypeScript for no specific reason (Python might be more popular
choice for Raspberry Pi programs, but I really like Node.js event loop in cases
like this one where we need to pipe the data from `arecord` to an HTTP
connection and then pipe it to `aplay` on the other side).

Note: there is no error handling by design. We log and ignore all HTTP errors.
If anything else is wrong, we crash.
Run the program from a shell script:

```sh
#!/bin/sh

export PATH=/path/to/nodejs/bin:$PATH
while :; do
  npm start
done
```

This script can be put in crontab `@reboot` (redirecting output into a log
file). In this particular case, with Raspberry Pi, GPIO button, and mDNS, it's
probably better to crash and restart (and reannounce ourselves) in any weird
case rather than try to recover from an error.

Logs (printed by `console.log` here and there) are helpful to debug what's
going on. Also, `curl http://localhost:4242/debug` shows what the given
instance knows about itself and its neighbors.

## Tests

Not at this time. At this point, I can either make a bunch of [change detector
tests](https://testing.googleblog.com/2015/01/testing-on-toilet-change-detector-tests.html),
or spend a week properly injecting all dependencies (GPIO, mDNS, HTTP) which
just does not make any sense for a fun project because it's not fun.
Contributions are appreciated :)

## Copyright

I work for Google, so the code has Google copyright. But see the following
disclaimer:

## Disclaimer

This is not an official Google project.
