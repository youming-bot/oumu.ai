// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock global objects for testing
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock IndexedDB for testing
const { indexedDB, IDBKeyRange } = require('fake-indexeddb')
global.indexedDB = indexedDB
global.IDBKeyRange = IDBKeyRange

// Mock Blob and File for testing
global.Blob = class Blob {
  constructor(data, options = {}) {
    this.data = data;
    this.type = options.type || '';
  }

  arrayBuffer() {
    return Promise.resolve(new ArrayBuffer(0));
  }
}
global.File = class File {}

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Mock structuredClone for Jest environment
if (typeof global.structuredClone === 'undefined') {
  global.structuredClone = function structuredClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  };
}