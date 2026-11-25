const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const assert = require('node:assert/strict');

const root = path.join(__dirname, '..');
const resourceOrder = [
    /^\/element-ui@[^/]+\/lib\/theme-chalk\/index\.css$/,
    /^\/vue@[^/]+\/dist\/vue\.min\.js$/,
    /^\/element-ui@[^/]+\/lib\/index\.js$/,
    /^\/axios@[^/]+\/dist\/axios\.min\.js$/,
    '/js/api.js',
    '/js/report_materials.js',
    '/css/report_materials.css',
    '/js/print_export.js',
    /^\/ajax\/libs\/moment\.js\/[^/]+\/moment\.min\.js$/,
    /^\/ajax\/libs\/moment\.js\/[^/]+\/locale\/zh-cn\.min\.js$/,
    'page.css',
    '/css/common.css',
    '/css/security_master_diff.css',
    '/js/security_master_diff.js'
];

test('HTML 页面按固定顺序引入资源，按需跳过未使用的项', () => {
    const pages = ['.', 'pages', 'docs'].flatMap(directory => fs.readdirSync(path.join(root, directory), { withFileTypes: true })
        .filter(entry => entry.isFile() && entry.name.endsWith('.html'))
        .map(entry => path.posix.join(directory, entry.name)));

    for (const page of pages) {
        const html = fs.readFileSync(path.join(root, page), 'utf8').replace(/<!--[\s\S]*?-->/g, '');
        const pageStyle = `/css/${path.basename(page, '.html')}.css`;
        let previousIndex = -1;
        let previousUrl;

        for (const [, script, link] of html.matchAll(/<script\b([^>]*)>[\s\S]*?<\/script\s*>|<link\b([^>]*)>/gi)) {
            const url = script !== undefined
                ? script.match(/\ssrc\s*=\s*["']([^"']+)["']/i)?.[1]
                : link.match(/\srel\s*=\s*["']stylesheet["']/i) && link.match(/\shref\s*=\s*["']([^"']+)["']/i)?.[1];
            if (!url) continue;

            const { pathname } = new URL(url, `https://rrs.test/${page}`);
            const resource = pathname === pageStyle ? 'page.css' : pathname;
            const index = resourceOrder.findIndex(entry => typeof entry === 'string' ? entry === resource : entry.test(resource));
            assert.ok(index >= 0, `${page} 中的 ${url} 缺少约定的引入位置`);
            assert.ok(index >= previousIndex, `${page} 中的 ${url} 应放在 ${previousUrl} 前面`);
            previousIndex = index;
            previousUrl = url;
        }
    }
});
