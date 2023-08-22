/* Copyright 2018 Streampunk Media Ltd.

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

const addon = require("pkg-prebuilds")(
  __dirname,
  require("./binding-options")
);
const { promisify } = require('util')
const setTimeoutPromise = promisify(setTimeout)

// TODO: reenable segfault-handler when the NDI lib is fixed
// const SegfaultHandler = require('segfault-handler');
// SegfaultHandler.registerHandler("crash.log"); // With no argument, SegfaultHandler will generate a generic log file name

const COLOR_FORMAT_BGRX_BGRA = 0; // No alpha channel: BGRX, Alpha channel: BGRA
const COLOR_FORMAT_UYVY_BGRA = 1; // No alpha channel: UYVY, Alpha channel: BGRA
const COLOR_FORMAT_RGBX_RGBA = 2; // No alpha channel: RGBX, Alpha channel: RGBA
const COLOR_FORMAT_UYVY_RGBA = 3; // No alpha channel: UYVY, Alpha channel: RGBA

// On Windows there are some APIs that require bottom to top images in RGBA format. Specifying
// this format will return images in this format. The image data pointer will still point to the
// "top" of the image, althought he stride will be negative. You can get the "bottom" line of the image
// using : video_data.p_data + (video_data.yres - 1)*video_data.line_stride_in_bytes
const COLOR_FORMAT_BGRX_BGRA_FLIPPED = 200;

const COLOR_FORMAT_FASTEST = 100;

const BANDWIDTH_METADATA_ONLY = -10; // Receive metadata.
const BANDWIDTH_AUDIO_ONLY    =  10; // Receive metadata, audio.
const BANDWIDTH_LOWEST        =  0; // Receive metadata, audio, video at a lower bandwidth and resolution.
const BANDWIDTH_HIGHEST       =  100; // Receive metadata, audio, video at full resolution.

const FORMAT_TYPE_PROGRESSIVE = 1;
const FORMAT_TYPE_INTERLACED = 0;
const FORMAT_TYPE_FIELD_0 = 2;
const FORMAT_TYPE_FIELD_1 = 3;

// Default NDI audio format
// Channels stored one after the other in each block - 32-bit floating point values
const AUDIO_FORMAT_FLOAT_32_SEPARATE = 0;
// Alternative NDI audio foramt
// Channels stored as channel-interleaved 32-bit floating point values
const AUDIO_FORMAT_FLOAT_32_INTERLEAVED = 1;
// Alternative NDI audio format
// Channels stored as channel-interleaved 16-bit integer values
const AUDIO_FORMAT_INT_16_INTERLEAVED = 2;

class GrandioseFinder{
  #addon

  constructor(options) {
    const newOptions = options ? {
      showLocalSources: options.showLocalSources,
      groups: Array.isArray(options.groups) ? options.groups.join(','):options.groups,
      extraIPs: Array.isArray(options.extraIPs) ? options.extraIPs.join(','):options.extraIPs,
    } : undefined
    this.#addon = new addon.GrandioseFinder(newOptions)
  }

  dispose(...args) {
    return this.#addon.dispose(...args)
  }

  getCurrentSources(...args) { 
    return this.#addon.getCurrentSources(...args)
  }
}

// API compataibility in a find implemenation
async function findCompat(options = {}, waitMs = 0) {
  if (options.showLocalSources === undefined) options.showLocalSources = true
  const finder = new GrandioseFinder(options)

  if (!waitMs || typeof waitMs !== 'number') waitMs = 10000
  const maxTime = Date.now() + waitMs

  try {
    // Until the timeout has been reached
    while(Date.now() < maxTime) {
      // Sleep for a short period
      await setTimeoutPromise(50)

      // Check if any have been found
      const sources = finder.getCurrentSources()
      if (sources.length > 0) {
        return sources
      }
    }

    throw new Error('No sources were found')

  } finally {
    finder.dispose()
  }
}

module.exports = {
  version: addon.version,
  find: findCompat,
  GrandioseFinder: GrandioseFinder,
  isSupportedCPU: addon.isSupportedCPU,
  receive: addon.receive,
  send: addon.send,
  COLOR_FORMAT_BGRX_BGRA, COLOR_FORMAT_UYVY_BGRA,
  COLOR_FORMAT_RGBX_RGBA, COLOR_FORMAT_UYVY_RGBA,
  COLOR_FORMAT_BGRX_BGRA_FLIPPED, COLOR_FORMAT_FASTEST,
  BANDWIDTH_METADATA_ONLY, BANDWIDTH_AUDIO_ONLY,
  BANDWIDTH_LOWEST, BANDWIDTH_HIGHEST,
  FORMAT_TYPE_PROGRESSIVE, FORMAT_TYPE_INTERLACED,
  FORMAT_TYPE_FIELD_0, FORMAT_TYPE_FIELD_1,
  AUDIO_FORMAT_FLOAT_32_SEPARATE, AUDIO_FORMAT_FLOAT_32_INTERLEAVED,
  AUDIO_FORMAT_INT_16_INTERLEAVED
};
