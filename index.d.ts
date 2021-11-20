declare module "@tremho/jove-common" {
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
    export function testRemote(t: any, action: string, description: string, expected: any): Promise<boolean>;
    /**
     * similar to `testRemote`, but simply calls the action and returns the result without submitting to test
     *
     * @param action The directive to perform
     * @returns {string} The JSON result of the action, Stringified
     */
    export function callRemote(action: string): Promise<unknown>;
    /**
     * Should be called at the top of a test suite, but it's just for symmetry with `endTest`
     * In this version, nothing is actually sent to the server.
     * @param t The tap instance, if using tap
     *
     * return {boolean} true if stream is ready.
     */
    export function startTest(t?: any): Promise<boolean>;
    /**
     * Call when all the tests are complete.  The client will continue with its disposition after that, either exiting, or
     * continuing to run.  This should be the end of any remote testing, regardless.
     * @param t The tap instance, if using tap.  Will signal the end on this tap instance.
     */
    export function endTest(t?: any): Promise<void>;
    /**
     * Initiate the connected test.  Pass the title of the test and the async function that conducts the test suite
     *
     * At this point the client has been launched, possibly under appium
     *
     * @param title Title of this test that will appear on the report
     * @param testFunc The function from the test script that conducts the test with `startTest` then a series of `testRemote` directives, then an `endTest`
     */
    export function runRemoteTest(title: string, testFunc: any): Promise<void>;
}