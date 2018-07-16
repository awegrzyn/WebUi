import {Observable, RemoteData} from '/js/src/index.js';

/**
 * Shadow model of Padlock, synchronize with the web server which contains the real one
 */
export default class Lock extends Observable {
  /**
   * Initialize lock state to NotAsked
   */
  constructor(model) {
    super();

    this.model = model;
    this.padlockState = { // Padlock state updated from server
      lockedBy: null,
      lockedByName: null,
    };
    this.padlockState = RemoteData.NotAsked();
  }

  /**
   * Set padlock state from ajax or websocket as a RemoteData
   * @param {string} padlockState - object representing PadLock from server
   */
  setPadlockState(padlockState) {
    this.padlockState = RemoteData.Success(padlockState);
    this.notify();
  }

  /**
   * Load Padlock state from server
   */
  async synchronizeState() {
    this.padlockState = RemoteData.Loading();
    this.notify();

    const {result, ok} = await this.model.loader.post(`/api/lockState`);
    if (!ok) {
      this.padlockState = RemoteData.Failure(result.message);
      this.notify();
      alert('Fatal error while loading LOCK, please reload the page');
      return;
    }
    this.padlockState = RemoteData.Success(result);
    this.notify();
  }

  /**
   * Ask server to get the lock of Control
   * Result of this action will be an update by WS
   */
  async lock() {
    this.padlockState = RemoteData.Loading();
    this.notify();

    const {result, ok} = await this.model.loader.post(`/api/lock`);
    if (!ok) {
      alert(result.message);
      return;
    }
  }

  /**
   * Ask server to release the lock of Control
   * Result of this action will be an update by WS
   */
  async unlock() {
    this.padlockState = RemoteData.Loading();
    this.notify();

    const {result, ok} = await this.model.loader.post(`/api/unlock`);
    if (!ok) {
      alert(result.message);
      return;
    }
  }
}
