import fs from 'fs';
import path from 'path';
import { KagazState, DEFAULT_STATE } from './store';

const DB_PATH = path.join(process.cwd(), 'db.json');

export function getServerState(): KagazState {
  try {
    if (fs.existsSync(DB_PATH)) {
      const data = fs.readFileSync(DB_PATH, 'utf-8');
      return JSON.parse(data) as KagazState;
    }
  } catch (error) {
    console.error('Failed to read db.json:', error);
  }
  
  setServerState(DEFAULT_STATE);
  return DEFAULT_STATE;
}

export function setServerState(state: KagazState) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(state, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to write to db.json:', error);
  }
}
