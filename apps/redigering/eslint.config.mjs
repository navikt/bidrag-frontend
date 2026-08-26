import path from "node:path";
import { fileURLToPath } from "node:url";

import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import jsonFormat from "eslint-plugin-json-format";
import prettier from "eslint-plugin-prettier";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import unusedImports from "eslint-plugin-unused-imports";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all,
});

export default [
    ...compat.extends("eslint:recommended", "plugin:@typescript-eslint/recommended", "plugin:prettier/recommended"),
    {
        plugins: {
            "@typescript-eslint": typescriptEslint,
            prettier,
            "json-format": jsonFormat,
            "simple-import-sort": simpleImportSort,
            "unused-imports": unusedImports,
        },
        languageOptions: {
            parser: tsParser,
            ecmaVersion: 2022,
            sourceType: "module",
            parserOptions: {
                ecmaFeatures: {
                    jsx: true,
                },
            },
        },
        settings: {
            react: {
                version: "detect",
            },
            "json/sort-package-json": ["name", "version", "private", "scripts", "dependencies", "devDependencies"],
        },
        rules: {
            "sort-imports": "off",
            "@typescript-eslint/no-namespace": "off",
            "@typescript-eslint/ban-ts-comment": "off",
            "simple-import-sort/imports": "error",
            "simple-import-sort/exports": "error",
            "no-unused-vars": "off",
            "unused-imports/no-unused-imports": "error",
            "@typescript-eslint/no-var-requires": "warn",
            "@typescript-eslint/no-empty-function": "warn",
            "@typescript-eslint/no-unused-vars": [
                "warn",
                {
                    vars: "all",
                    varsIgnorePattern: "^_",
                    args: "after-used",
                    argsIgnorePattern: "^_",
                },
            ],
        },
    },
    {
        files: ["**/*.js"],
        rules: {
            "no-undef": "off",
        },
    },
    {
        ignores: ["**/*.mdx"],
    },
];
