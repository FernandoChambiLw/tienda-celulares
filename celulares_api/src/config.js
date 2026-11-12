import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
export const UPLOADS_DIR = path.join(here, '..', 'uploads');
