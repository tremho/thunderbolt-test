declare module "@tremho/jove-common" {
    /**
     * Transact a single remote test action at the connected app client
     *
     * @param t The tap instance passed into test execution function from `runRemoteTest`
     * @param action The directive to perform
     * @param description A description of this test action
     * @param expected The expected return result of this test action
     */
    export declare function testRemote(t: any, action: string, description: string, expected: any): Promise<void>;

    /**
     * Should be called at the top of a test suite
     * It really only serves to synchronize subsequent test/returns, and can theoretically be called after the start also.
     * @param t The tap instance
     */
    export declare function startTest(t: any): Promise<void>;

    /**
     * Call when all the tests are complete.  The client will continue with its disposition after that, either exiting, or
     * continuing to run.
     * @param t The tap instance
     */
    export declare function endTest(t: any): Promise<void>;

    /**
     * Initiate the connected test.  Pass the title of the test and the async function that conducts the test suite
     *
     * @param title Title of this test that will appear on the report
     * @param testFunc The function that conducts the test with `startTest` then a series of `testRemote` directives, then an `endTest`
     */
    export declare function runRemoteTest(title: string, testFunc: any): Promise<void>;
}