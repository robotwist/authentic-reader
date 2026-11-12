// Opens a Netlify Blobs store for the linked site, using the Netlify CLI login on this machine.
import fs from 'node:fs';
import os from 'node:os';
import { getStore } from '@netlify/blobs';

export function siteStore(name) {
  const config = JSON.parse(fs.readFileSync(`${os.homedir()}/.config/netlify/config.json`, 'utf8'));
  const token = Object.values(config.users)[0].auth.token;
  const { siteId } = JSON.parse(fs.readFileSync('.netlify/state.json', 'utf8'));
  return getStore({ name, siteID: siteId, token, consistency: 'strong' });
}
