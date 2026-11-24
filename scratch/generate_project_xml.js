/**
 * @file generate_project_xml.js
 * @description Compiles the complete AeroInsight codebase into a unified, valid XML document.
 */

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const outputFile = path.join(root, 'aeroinsight_project.xml');

const includePatterns = [
    /^backend\/src\//,
    /^backend\/package\.json$/,
    /^backend\/Dockerfile$/,
    /^backend\/\.env\.example$/,
    /^frontend\/src\//,
    /^frontend\/package\.json$/,
    /^frontend\/vite\.config\.js$/,
    /^frontend\/index\.html$/,
    /^frontend\/Dockerfile$/,
    /^simulation\/Assets\/Editor\//,
    /^simulation\/Assets\/Scripts\//,
    /^simulation\/Assets\/Materials\//,
    /^simulation\/Assets\/AeroInsight\.Simulation\.asmdef$/,
    /^simulation\/Packages\/manifest\.json$/,
    /^docker-compose\.yml$/,
    /^package\.json$/,
    /^README\.md$/,
    /^TASKS\.md$/,
    /^CHANGELOG\.md$/,
    /^mcp_task_action\.md$/,
    /^scratch\/test_agent_a_mcp_features\.js$/
];

const ignoreExts = new Set(['.png', '.jpg', '.jpeg', '.webp', '.asset', '.unity', '.prefab', '.meta', '.dll', '.pdb', '.ico']);
const ignoreDirs = new Set(['node_modules', '.git', 'Library', 'Temp', 'Logs', 'obj', 'dist', 'build', '.kilo', 'trendpulse_workspace', 'public']);

const fileEntries = [];

function scan(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const ent of entries) {
        const fullPath = path.join(dir, ent.name);
        const relPath = path.relative(root, fullPath).replace(/\\/g, '/');
        if (ent.isDirectory()) {
            if (!ignoreDirs.has(ent.name)) {
                scan(fullPath);
            }
        } else {
            const ext = path.extname(ent.name).toLowerCase();
            if (ignoreExts.has(ext)) continue;
            const match = includePatterns.some((p) => p.test(relPath));
            if (match) {
                fileEntries.push({ fullPath, relPath });
            }
        }
    }
}

scan(root);
fileEntries.sort((a, b) => a.relPath.localeCompare(b.relPath));

const header = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<project name="AeroInsight" generated_at="' + new Date().toISOString() + '">',
    '  <metadata>',
    '    <title>AeroInsight: Geospatial Drone Telemetry &amp; Unity MCP Digital Twin</title>',
    '    <version>2.0.0</version>',
    '    <architecture>Full-Stack Drone Fleet Analytics (Express + React + Unity MCP)</architecture>',
    '    <file_count>' + fileEntries.length + '</file_count>',
    '  </metadata>',
    '  <files>'
].join('\n');

const chunks = [header];

for (const entry of fileEntries) {
    try {
        let content = fs.readFileSync(entry.fullPath, 'utf8');
        // Handle nested CDATA tokens safely
        content = content.replace(/\]\]>/g, ']]]]><![CDATA[>');
        chunks.push(`\n    <file path="${entry.relPath}">\n      <content><![CDATA[${content}]]></content>\n    </file>`);
    } catch (err) {
        console.error(`Error processing ${entry.relPath}:`, err.message);
    }
}

chunks.push('\n  </files>\n</project>\n');

fs.writeFileSync(outputFile, chunks.join(''), 'utf8');
const stat = fs.statSync(outputFile);
console.log(`Successfully generated ${outputFile} (${(stat.size / 1024).toFixed(1)} KB, ${fileEntries.length} files).`);
