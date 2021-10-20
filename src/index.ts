import Tap from 'tap'

import {H2Server, setActionCallback, waitToConnect} from "./H2Server";


let desc: string, r:any, x: any
let count = 0;

async function puppetTest(action:string):Promise<string> {
    return new Promise(resolve => {
        setActionCallback(action, (res:string) => {
            let n = res.indexOf(':')
            let rcount = Number(res.substring(0, n))
            res = res.substring(n+1)
            const parts = res.split('=')
            const ract = (parts[0] || '').trim()
            const ans = (parts[1] || '').trim()

            if(ract === action.trim()) {
                resolve(ans)
            }
        })
    })
}

/**
 * Transact a single remote test action at the connected app client
 *
 * @param t The tap instance passed into test execution function from `runRemoteTest`
 * @param action The directive to perform
 * @param description A description of this test action
 * @param expected The expected return result of this test action
 */
export async function testRemote(t:any, action:string, description:string, expected:any) {
    desc = description
    x = ''+expected
    r = await puppetTest(action)
    t.ok(r === x, desc + ` expected ${x}, got ${r}`)
}
/**
 * similar to `testRemote`, but simply calls the action and returns the result without submitting to test
 *
 * @param action The directive to perform
 * @returns {string} The JSON result of the action, Stringified
 */
export async function callRemote(action:string) {
    const raw = await puppetTest(action)
    return JSON.stringify(raw)
}
/**
 * Should be called at the top of a test suite
 * It really only serves to synchronize subsequent test/returns, and can theoretically be called after the start also.
 * @param t The tap instance
 */
export async function startTest(t:any) {

    desc = 'first connect'
    r = await puppetTest('start')
    x = ''
    const ok = r === x
    t.ok(ok, desc + ok ? ' successful': ' FAILED')
}

/**
 * Call when all the tests are complete.  The client will continue with its disposition after that, either exiting, or
 * continuing to run.
 * @param t The tap instance
 */
export async function endTest(t:any) {
    t.end()
    puppetTest('end')
}

/**
 * Initiate the connected test.  Pass the title of the test and the async function that conducts the test suite
 *
 * @param title Title of this test that will appear on the report
 * @param testFunc The function that conducts the test with `startTest` then a series of `testRemote` directives, then an `endTest`
 */
export async function runRemoteTest(title:string, testFunc:any) {
    const stream = new H2Server()
    stream.listen()
    return Tap.test('Proof of concept walk-thru', t => {
        return waitToConnect().then(() => {
            return testFunc(t)
        })
    })
}

