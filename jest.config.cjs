module.exports = {
  clearMocks: true,
  collectCoverage: true,
  coverageDirectory: "coverage",
  coverageProvider: "v8", // or 'babel' if you prefer
  preset: "ts-jest",
  testEnvironment: "node", // Suitable for backend services
  setupFilesAfterEnv: ["./jest.setup.ts"], // Optional: for setup files like jest-dom for frontend
  moduleNameMapper: {
    // Handle module aliases (if you have them in tsconfig.json)
    // Example: '^@/(.*)$': '<rootDir>/src/$1'

    // Mock CSS imports (primarily for frontend components, good to have)
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",

    // Mock image imports (primarily for frontend components)
    "\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$":
      "<rootDir>/__mocks__/fileMock.js",
  },
  testPathIgnorePatterns: [
    "<rootDir>/node_modules/",
    "<rootDir>/.next/",
    "<rootDir>/out/",
    "<rootDir>/tests/e2e/",
  ],
  // Fix transform ignore patterns to handle ES modules in node_modules
  transformIgnorePatterns: [
    "node_modules/(?!(parse-duration|ipfs-http-client|multiformats|@google/genai)/)"
  ],
  transform: {
    "^.+\\.(ts|tsx)$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.json",
        useESM: true,
      },
    ],
  },
  // Handle ES modules properly
  extensionsToTreatAsEsm: ['.ts'],
  // Consider adding coverage thresholds for production readiness
  coverageThreshold: {
    global: {
      branches: 25,
      functions: 25,
      lines: 25,
      statements: 25,
    },
  },
};
