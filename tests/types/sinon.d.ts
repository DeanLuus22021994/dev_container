// Import sinon types
import * as sinon from 'sinon';

declare global {
  namespace jest {
    interface It {
      /**
       * Only runs this test in the current file.
       */
      only: It;
      /**
       * Skip running this test in the current file.
       */
      skip: It;
      /**
       * Run the test concurrently.
       */
      concurrent: It;
    }
  }
}

// Add missing SinonSandbox methods
declare module 'sinon' {
  interface SinonSandbox {
    /**
     * Restores all fakes created through sandbox.
     */
    restore(): void;
    
    /**
     * Creates a new fake that will replace obj[method] with a function that will invoke callback when called.
     */
    stub(): sinon.SinonStub;
  }
}