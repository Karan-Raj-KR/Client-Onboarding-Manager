const fs = require('fs');

const storePath = 'src/lib/store.ts';
const schemaPath = 'src/lib/schema.ts';
const serverDbPath = 'src/lib/server-db.ts';
const apiRoutePath = 'src/app/api/state/route.ts';

const storeContent = fs.readFileSync(storePath, 'utf8');

// 1. Extract everything from start up to `export function getKagazState()`
const breakPoint = storeContent.indexOf('let memoryState = DEFAULT_STATE;');
const schemaContentPart = storeContent.substring(0, breakPoint);
const restOfStore = storeContent.substring(breakPoint);

// Clean up schema part (remove useState, useEffect import)
const finalSchemaContent = schemaContentPart.replace(/import \{ useState, useEffect \} from 'react';\n*/, '');

fs.writeFileSync(schemaPath, finalSchemaContent);

// 2. Rewrite store.ts to import what it needs from schema.ts
const newStoreContent = `import { useState, useEffect } from 'react';
import { 
  KagazState, DEFAULT_STATE, Deal, Quote, Invoice, Payment, BusinessProfile, RateCardItem, Reminder, DealLineItem, QuoteLineItem
} from './schema';

export * from './schema';

` + restOfStore;

fs.writeFileSync(storePath, newStoreContent);

// 3. Update server-db.ts
let serverDb = fs.readFileSync(serverDbPath, 'utf8');
serverDb = serverDb.replace(/from '.\/store'/g, "from './schema'");
fs.writeFileSync(serverDbPath, serverDb);

// 4. Update api/state/route.ts
let apiRoute = fs.readFileSync(apiRoutePath, 'utf8');
apiRoute = apiRoute.replace(/from '@\/lib\/store'/g, "from '@/lib/schema'");
fs.writeFileSync(apiRoutePath, apiRoute);

console.log("Extraction complete.");
