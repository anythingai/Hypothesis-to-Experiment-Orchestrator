/* eslint-disable @typescript-eslint/no-explicit-any */
import "@testing-library/jest-dom";

// Polyfill fetch, Request, and Response in jsdom environment
import 'whatwg-fetch';

// Polyfill setImmediate in jsdom environment
(global as any).setImmediate = global.setImmediate || ((fn: any) => setTimeout(fn, 0));
