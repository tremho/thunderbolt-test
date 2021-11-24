import Tap from 'tap'

import {WSServer,setEndResolver} from "./WSServer"
import path from "path";
import fs from "fs";

import {compareToComp} from "./imageComp";


let stream:WSServer
let desc: string, r:any, x: any

let runcount = 0
let previous:Promise<unknown>
let prevResolve:any

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
export async function testRemote(t:any, action:string, description:string, expected?:any) {
    desc = description
    x = expected
    r = await stream.sendDirective(action)
    if(typeof r === 'string' && typeof x !== 'string') x = ''+x
    const ok = r === x
    if(t) t.ok(ok, desc + ` expected ${x}, got ${r}`)
    return ok

}
/**
 * similar to `testRemote`, but simply calls the action and returns the result without submitting to test
 *
 * @param action The directive to perform
 * @returns {string} The JSON result of the action, Stringified
 */
export async function callRemote(action:string) {
    // console.log('callRemote', action)
    return  await stream.sendDirective(action)
}
/**
 * Should be called at the top of a test suite, but it's just for symmetry with `endTest`
 * In this version, nothing is actually sent to the server.
 * @param t The tap instance, if using tap
 *
 * return {boolean} true if stream is ready.
 */
export async function startTest(t:any = null) {

    // console.log("%%%%%%%%%%%%%% startTest directive called %%%%%%%%%%%%%%%")
    desc = 'stream connect'
    r = !!stream
    x = true
    const ok = r === x
    if(t) t.ok(ok, desc + (ok ? ' successful': ' FAILED'))
    return ok
}

/**
 * Call when all the tests are complete.  The client will continue with its disposition after that, either exiting, or
 * continuing to run.  This should be the end of any remote testing, regardless.
 * @param t The tap instance, if using tap.  Will signal the end on this tap instance.
 */
export async function endTest(t:any = null) {
    console.log('endTest called', prevResolve)
    if(t) t.end()
    let report:any = await stream.sendDirective('getReport')
    report = report.replace(/--/g, '=')
    saveReport(report)

    return stream.sendDirective('end')
}


/**
 * Initiate the connected test.  Pass the title of the test and the async function that conducts the test suite
 *
 * At this point the client has been launched, possibly under appium
 *
 * @param title Title of this test that will appear on the report
 * @param testFunc The function from the test script that conducts the test with `startTest` then a series of `testRemote` directives, then an `endTest`
 */
export async function runRemoteTest(title:string, testFunc:any) {

    stream = new WSServer()
    let cf = await stream.listen()
    setEndResolver(() => {
        process.exit(0)
    })
    await stream.sendDirective('startReport '+title)
    return Tap.test('Remote E2E: '+title, (t:any) => {
        if(cf) testFunc(t)
        else {
            t.ok(false, 'Only one Remote Test in a test suite is allowed.')
        }
    })
}

/**
 * Takes a screenshot of the current page
 *
 * Image will be saved as a PNG in the appropriate report directory
 *
 * @param name Name to give this image
 */
export async function screenshot(name:string) {
    // console.log('jove-test is issuing a screenshot call...')
    const ssrt:any =  await stream.sendDirective('screenshot '+name)
    if(ssrt.substring(0,4) === 'data') {
        console.log('we see a base 64 return of', ssrt.substring(0,10)+'...', 'that we could write to a file for', name)

        const rootPath = path.resolve('.')
        if(fs.existsSync(path.join(rootPath, 'report', 'latest'))) {

                const rptImgPath = path.join(rootPath, 'report', 'latest', 'images')
                fs.mkdirSync(rptImgPath, {recursive: true})
                const imgPath = path.join(rptImgPath, name + '.png')
                const b64 = ssrt.substring(ssrt.indexOf(',') + 1)
                fs.writeFileSync(imgPath, b64, "base64")
                console.log('image saved as', fs.realpathSync(imgPath))
                console.log('verified: ', fs.existsSync(imgPath))
                return imgPath
        } else {
            console.error('rootPath is not recognized', rootPath)
            return "ERR:Bad-rootPath"
        }
    }
    console.error('data return not recognized', ssrt.substring(0,5))
    return "ERR:Not-Base64"
}

/**
 * Compare a screenshot taken with `screenshot` to a comp file
 * in the `reports/comp` directory of the same name
 * @param t the Tap object to report through , or null if not using
 * @param name Name of the screenshot / comp image
 * @param [passingPct] Percentage of pixels that can be different and still pass (default = 0)
 */
export async function compare(t:any, name:string, passingPct= 0) {
    console.log('test: compare --->>')
    const data:any = await compareToComp(name+".png", passingPct)
    console.log('data returned', data)
    let ok = data && data.ok
    let message = (ok ? 'image matches' : data.error || 'image does not match'+ ` (${data.percentDiff}% difference)`)
    if(t) t.ok(ok, 'compare '+name+': '+message)
    if(!ok) {
        let res = `${name},${data.percentDiff},${data.error || ''}`
        await callRemote('compareReport ' + res)
    }
    return data

}

export async function remoteTitle(t:any, title:string) {
    await callRemote('remoteTitle '+title.replace(/ /g, '+'))
    if(t) {
        t.ok(true, '>remoteTitle: '+title)
    }
}

function saveReport(report:string) {
    const rootPath = path.resolve('.')
    // console.log("TEST REPORT ROOT PATH", rootPath)
    if(fs.existsSync(path.join(rootPath, 'package.json'))) {
        const dtf = "current"
        const folderPath = path.join(rootPath, 'report', 'latest')
        // fs.mkdirSync(folderPath, {recursive:true})
        const rptPath = path.join(folderPath, 'report.html')
        // console.log("TEST REPORT PATH", rptPath)
        fs.writeFileSync(rptPath, report)
    } else {
        console.error('TEST REPORT: Root path not detected at ', rootPath)
    }
}


