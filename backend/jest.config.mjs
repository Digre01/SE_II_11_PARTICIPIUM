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
    '**/test/**/*.spec.js'
    ],
    coveragePathIgnorePatterns: [
        "node_modules",
        "test-config",
        "<rootDir>/src/app/app.js",
        "\\.mock\\.js",
        "seeder.js"
    ],
    collectCoverage: true,
    //collectCoverageFrom: ["backend/**/*.{js,mjs}", "!backend/{config, database, entities, DTOs, errors, public}",],
    coverageReporters: ["text", "html", "lcov"],
};
