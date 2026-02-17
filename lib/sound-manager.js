// Mock sound manager for testing
const soundManager = {
  play: jest.fn(),
  stop: jest.fn(),
  setVolume: jest.fn(),
  load: jest.fn(),
};

export default soundManager;