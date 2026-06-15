// 同步 package.json 版本号到 src/constants/version.ts
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkgPath = resolve(__dirname, '..', 'package.json');
const versionPath = resolve(__dirname, '..', 'src', 'constants', 'version.ts');

const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
const version = pkg.version;

const content = `// 由 scripts/sync-version.js 自动生成，请勿手动编辑
export const APP_VERSION = '${version}';
export const APP_NAME = 'PCAplot';
// @ts-ignore __BUILD_TIME__ 由 Vite define 注入
export const BUILD_TIME: string = (typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : new Date().toISOString()) as string;
`;

writeFileSync(versionPath, content, 'utf-8');
console.log(`Synced version ${version} to src/constants/version.ts`);
