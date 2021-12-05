/**
 * Transact a single remote test action at the connected app client
 *
 * @param t The tap instance passed into test execution function from `runRemoteTest`, or null to skip tap
 * @param action The directive to perform
 * @param description A description of this test action
 * @param expected The expected return result of this test action
 *
 * @return {boolean} the result of the test result matching expected; may be ignored.
 */
export declare function testRemote(t: any, action: string, description: string, expected?: any): Promise<boolean>;
/**
 * similar to `testRemote`, but simply calls the action and returns the result without submitting to test
 *
 * @param action The directive to perform
 * @returns {string} The JSON result of the action
 */
export declare function callRemote(action: string): Promise<unknown>;
/**
 * Should be called at the top of a test suite, but it's just for symmetry with `endTest`
 * In this version, nothing is actually sent to the server.
 * @param t The tap instance, if using tap
 *
 * return {boolean} true if stream is ready.
 */
export declare function startTest(t?: any): Promise<boolean>;
/**
 * Call when all the tests are complete.  The client will continue with its disposition after that, either exiting, or
 * continuing to run.  This should be the end of any remote testing, regardless.
 * @param t The tap instance, if using tap.  Will signal the end on this tap instance.
 */
export declare function endTest(t?: any): Promise<unknown>;
/**
 * Initiate the connected test.  Pass the title of the test and the async function that conducts the test suite
 *
 * At this point the client has been launched, possibly under appium
 *
 * @param title Title of this test that will appear on the report
 * @param testFunc The function from the test script that conducts the test with `startTest` then a series of `testRemote` directives, then an `endTest`
 */
export declare function runRemoteTest(title: string, testFunc: any): Promise<void>;
/**
 * Takes a screenshot of the current page
 *
 * Image will be saved as a PNG in the appropriate report directory
 *
 * @param name Name to give this image
 */
export declare function screenshot(name: string): Promise<string>;
/**
 * Compare a screenshot taken with `screenshot` to a comp file
 * in the `reports/comp` directory of the same name
 * @param t the Tap object to report through , or null if not using
 * @param name Name of the screenshot / comp image
 * @param [passingPct] Percentage of pixels that can be different and still pass (default = 0)
 */
export declare function compare(t: any, name: string, passingPct?: number): Promise<any>;
export declare function remoteTitle(t: any, title: string): Promise<void>;
