export default {
    testEnvironment: 'node',
    transform: {},
    verbose: true,
    testMatch: [
        '**/test/*.test.mjs',
        '**/test/*.test.js',
    ],
    coveragePathIgnorePatterns: [
        "node_modules",
    ],
    collectCoverage: true,
    rootDir: ".",
    collectCoverageFrom: [
        "<rootDir>/src/scenes/**.js",
    ],
    coverageReporters: ["text", "html", "lcov"],
    maxWorkers: 1
};
