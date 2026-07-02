/**
 * Generisk migrasjonsscript for monorepo-imports
 *
 * Kjøres fra repo-root:
 *   pnpm tsx scripts/migrate-imports.ts [<mappe>]
 *
 * Standard target: apps/web/app
 *
 * Regler:
 *   1. @navikt/bidrag-ui-common              → @bidrag/common
 *   2. react-router-dom                      → react-router
 *   3. ~/api/** | (../)+ api/**              → @bidrag/api/**
 *   4. ~/utils/** | (../)+ utils/**          → @bidrag/utils/**
 */

import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const targetDir = process.argv[2] ?? "apps/web/app";

type Rule = {
    description: string;
    pattern: RegExp;
    replacement: string;
};

const rules: Rule[] = [
    {
        description: "@navikt/bidrag-ui-common → @bidrag/common",
        pattern: /from ["']@navikt\/bidrag-ui-common["']/g,
        replacement: 'from "@bidrag/common"',
    },
    {
        description: "react-router-dom → react-router",
        pattern: /from ["']react-router-dom["']/g,
        replacement: 'from "react-router"',
    },
    {
        description: "~/api/** | (../)+ api/** → @bidrag/api/**",
        pattern: /from ["'](?:~\/|(?:\.\.\/)+)api\/([^"']+)["']/g,
        replacement: 'from "@bidrag/api/$1"',
    },
    {
        description: "~/utils/** | (../)+ utils/** → @bidrag/utils/**",
        pattern: /from ["'](?:~\/|(?:\.\.\/)+)utils\/([^"']+)["']/g,
        replacement: 'from "@bidrag/utils/$1"',
    },
];

function collectFiles(dir: string): string[] {
    const entries = readdirSync(dir);
    return entries.flatMap((entry) => {
        const full = join(dir, entry);
        if (statSync(full).isDirectory()) return collectFiles(full);
        if (full.endsWith(".ts") || full.endsWith(".tsx")) return [full];
        return [];
    });
}

const files = collectFiles(targetDir);
let totalChanges = 0;

for (const filePath of files) {
    const original = readFileSync(filePath, "utf-8");
    let updated = original;
    const appliedRules: string[] = [];

    for (const rule of rules) {
        const result = updated.replace(rule.pattern, rule.replacement);
        if (result !== updated) {
            appliedRules.push(rule.description);
            updated = result;
        }
    }

    if (updated !== original) {
        writeFileSync(filePath, updated, "utf-8");
        console.log(`✅ ${filePath}`);
        for (const r of appliedRules) {
            console.log(`   • ${r}`);
        }
        totalChanges++;
    }
}

if (totalChanges === 0) {
    console.log("Ingen endringer – scriptet er allerede kjørt.");
} else {
    console.log(`\nOppdaterte ${totalChanges} fil(er).`);
}
