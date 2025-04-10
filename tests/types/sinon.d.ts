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
      /**
       * Each test will be retried if it fails.
       */
      retry(times: number): It;
    }
  }
}

// Make SinonSandbox available to tests
declare module 'sinon' {
  export interface SinonSandbox extends sinon.SinonSandbox {}
}