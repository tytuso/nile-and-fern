import { copyFile } from 'node:fs/promises';
await copyFile('src/domain.ts','supabase/functions/nile-fern-intake/domain.ts');
