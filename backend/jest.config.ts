import type { Config } from 'jest';

const tsJestTransform: [string, Record<string, unknown>] = [
  'ts-jest',
  {
    tsconfig: {
      module: 'commonjs',
      moduleResolution: 'node',
      esModuleInterop: true,
      target: 'ES2020',
      verbatimModuleSyntax: false,
    },
  },
];

const config: Config = {
  projects: [
    {
      displayName: 'unit',
      preset: 'ts-jest',
      testEnvironment: 'node',
      roots: ['<rootDir>/src'],
      testMatch: ['**/__tests__/**/*.test.ts'],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
      },
      setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
      transform: {
        '^.+\\.tsx?$': tsJestTransform,
      },
    },
    {
      displayName: 'e2e',
      preset: 'ts-jest',
      testEnvironment: 'node',
      roots: ['<rootDir>/e2e'],
      testMatch: ['**/*.test.ts'],
      transform: {
        '^.+\\.tsx?$': tsJestTransform,
      },
    },
  ],
  coverageDirectory: 'coverage',
  coveragePathIgnorePatterns: ['/node_modules/', '/__tests__/', '/e2e/'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};

export default config;
