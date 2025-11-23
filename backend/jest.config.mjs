export default {
    testEnvironment: 'node',
    // Con "type": "module" nel package.json del backend, Jest tratta automaticamente i .js come ESM.
    // Non serve extensionsToTreatAsEsm; lasciamo il default.
    transform: {},
    verbose: true,
    testMatch: [
    '**/test/**/*.test.mjs',
    '**/test/**/*.spec.mjs',
    '**/test/**/*.test.js',
    '**/test/**/*.spec.js',
        '**/test/**/**/*.test.js',
    ],
    coveragePathIgnorePatterns: [
        "node_modules",
        "test-config",
        "<rootDir>/src/app/app.js",
        "\\.mock\\.js",
        "seeder.js"
    ],
    collectCoverage: true,
    rootDir: ".",
    collectCoverageFrom: [
        "<rootDir>/controllers/**/*.{js,mjs}",
        "<rootDir>/mappers/**/*.{js,mjs}",
        "<rootDir>/middlewares/**/*.{js,mjs}",
        "<rootDir>/repositories/**/*.{js,mjs}",
        "<rootDir>/routes/**/*.{js,mjs}",
        "<rootDir>/services/**/*.{js,mjs}",
    ],
    coverageReporters: ["text", "html", "lcov"],
};
