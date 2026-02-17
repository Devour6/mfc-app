// Mock sound manager for testing
const soundManager = {
  play: jest.fn(),
  stop: jest.fn(),
  pause: jest.fn(),
  resume: jest.fn(),
  setVolume: jest.fn(),
  playTradeSound: jest.fn(),
  mute: jest.fn(),
  unmute: jest.fn(),
  load: jest.fn(),
};

export { soundManager };
export default soundManager;
