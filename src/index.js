"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.askAHuman = exports.remoteTitle = exports.compare = exports.screenshot = exports.runRemoteTest = exports.endTest = exports.startTest = exports.callRemote = exports.testRemote = void 0;
const tap_1 = __importDefault(require("tap"));
const WSServer_1 = require("./WSServer");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const imageComp_1 = require("./imageComp");
let stream;
let desc, r, x;
let runcount = 0;
let previous;
let prevResolve;
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
function testRemote(t, action, description, expected) {
    return __awaiter(this, void 0, void 0, function* () {
        desc = description;
        x = expected;
        r = yield stream.sendDirective(action);
        if (typeof r === 'string' && typeof x !== 'string')
            x = '' + x;
        const ok = r === x;
        if (t)
            t.ok(ok, desc + ` expected ${x}, got ${r}`);
        return ok;
    });
}
exports.testRemote = testRemote;
/**
 * similar to `testRemote`, but simply calls the action and returns the result without submitting to test
 *
 * @param action The directive to perform
 * @returns {string} The JSON result of the action
 */
function callRemote(action) {
    return __awaiter(this, void 0, void 0, function* () {
        // console.log('callRemote', action)
        let r = yield stream.sendDirective(action);
        if (typeof r === 'string') {
            try {
                r = JSON.parse(r);
            }
            catch (e) { }
        }
        return r;
    });
}
exports.callRemote = callRemote;
/**
 * Should be called at the top of a test suite, but it's just for symmetry with `endTest`
 * In this version, nothing is actually sent to the server.
 * @param t The tap instance, if using tap
 *
 * return {boolean} true if stream is ready.
 */
function startTest(t = null) {
    return __awaiter(this, void 0, void 0, function* () {
        // console.log("%%%%%%%%%%%%%% startTest directive called %%%%%%%%%%%%%%%")
        desc = 'stream connect';
        r = !!stream;
        x = true;
        const ok = r === x;
        if (t)
            t.ok(ok, desc + (ok ? ' successful' : ' FAILED'));
        return ok;
    });
}
exports.startTest = startTest;
/**
 * Call when all the tests are complete.  The client will continue with its disposition after that, either exiting, or
 * continuing to run.  This should be the end of any remote testing, regardless.
 * @param t The tap instance, if using tap.  Will signal the end on this tap instance.
 */
function endTest(t = null) {
    return __awaiter(this, void 0, void 0, function* () {
        // console.log('endTest called', prevResolve)
        if (t)
            t.end();
        let report = yield stream.sendDirective('getReport');
        report = report.replace(/--/g, '=');
        saveReport(report);
        return stream.sendDirective('end');
    });
}
exports.endTest = endTest;
/**
 * Initiate the connected test.  Pass the title of the test and the async function that conducts the test suite
 *
 * At this point the client has been launched, possibly under appium
 *
 * @param title Title of this test that will appear on the report
 * @param testFunc The function from the test script that conducts the test with `startTest` then a series of `testRemote` directives, then an `endTest`
 */
function runRemoteTest(title, testFunc) {
    return __awaiter(this, void 0, void 0, function* () {
        stream = new WSServer_1.WSServer();
        let cf = yield stream.listen();
        (0, WSServer_1.setEndResolver)(() => {
            process.exit(0);
        });
        yield stream.sendDirective('startReport ' + title);
        return tap_1.default.test('Remote E2E: ' + title, (t) => {
            if (cf)
                testFunc(t);
            else {
                t.ok(false, 'Only one Remote Test in a test suite is allowed.');
            }
        });
    });
}
exports.runRemoteTest = runRemoteTest;
/**
 * Takes a screenshot of the current page
 *
 * Image will be saved as a PNG in the appropriate report directory
 *
 * @param name Name to give this image
 */
function screenshot(t, name) {
    return __awaiter(this, void 0, void 0, function* () {
        // console.log('jove-test is issuing a screenshot call...')
        const ssrt = yield stream.sendDirective('screenshot ' + name);
        if (ssrt.substring(0, 4) === 'data') {
            // console.log('we see a base 64 return of', ssrt.substring(0,10)+'...', 'that we could write to a file for', name)
            const rootPath = path_1.default.resolve('.');
            if (fs_1.default.existsSync(path_1.default.join(rootPath, 'report', 'latest'))) {
                const rptImgPath = path_1.default.join(rootPath, 'report', 'latest', 'images');
                fs_1.default.mkdirSync(rptImgPath, { recursive: true });
                const imgPath = path_1.default.join(rptImgPath, name + '.png');
                const b64 = ssrt.substring(ssrt.indexOf(',') + 1);
                fs_1.default.writeFileSync(imgPath, b64, "base64");
                t.ok(true, 'screenshot ' + name + ' taken');
                // console.log('image saved as', fs.realpathSync(imgPath))
                // console.log('verified: ', fs.existsSync(imgPath))
                return imgPath;
            }
            else {
                t.ok(false, 'screenshot ' + name + ' fails - invalid root directory');
                console.error('rootPath is not recognized', rootPath);
                return "ERR:Bad-rootPath";
            }
        }
        t.ok(false, 'screenshot ' + name + ' fails - data return not recognized');
        console.error('data return not recognized', ssrt.substring(0, 5));
        return "ERR:Not-Base64";
    });
}
exports.screenshot = screenshot;
/**
 * Compare a screenshot taken with `screenshot` to a comp file
 * in the `reports/comp` directory of the same name
 * @param t the Tap object to report through , or null if not using
 * @param name Name of the screenshot / comp image
 * @param [passingPct] Percentage of pixels that can be different and still pass (default = 0)
 */
function compare(t, name, passingPct = 0) {
    return __awaiter(this, void 0, void 0, function* () {
        // console.log('test: compare --->>')
        const data = yield (0, imageComp_1.compareToComp)(name + ".png", passingPct);
        // console.log('data returned', data)
        let ok = data && data.ok;
        let message = (ok ? 'image matches' : data.error || 'image does not match' + ` (${data.percentDiff}% difference)`);
        if (t)
            t.ok(ok, 'compare ' + name + ': ' + message);
        if (!ok) {
            let res = `${name},${data.percentDiff},${data.error || ''}`;
            yield callRemote('compareReport ' + res);
        }
        return data;
    });
}
exports.compare = compare;
function remoteTitle(t, title) {
    return __awaiter(this, void 0, void 0, function* () {
        yield callRemote('remoteTitle ' + title.replace(/ /g, '+'));
        if (t) {
            t.ok(true, '>remoteTitle: ' + title);
        }
    });
}
exports.remoteTitle = remoteTitle;
function askAHuman(t, prompt, choices, expect) {
    return __awaiter(this, void 0, void 0, function* () {
        let px = prompt.replace(/\+/g, '%plus%');
        px = px.replace(/ /g, '+');
        let resp = yield callRemote('askAHuman ' + px + ' ' + choices);
        let xn = choices.indexOf(expect);
        let exprt = (resp == xn) ? `[${expect}]` : `[${choices[resp]}, expected ${expect}]`;
        t.ok(resp == expect, 'askAHuman: ' + prompt + exprt);
    });
}
exports.askAHuman = askAHuman;
function saveReport(report) {
    const rootPath = path_1.default.resolve('.');
    // console.log("TEST REPORT ROOT PATH", rootPath)
    if (fs_1.default.existsSync(path_1.default.join(rootPath, 'package.json'))) {
        const dtf = "current";
        const folderPath = path_1.default.join(rootPath, 'report', 'latest');
        // fs.mkdirSync(folderPath, {recursive:true})
        const rptPath = path_1.default.join(folderPath, 'report.html');
        // console.log("TEST REPORT PATH", rptPath)
        fs_1.default.writeFileSync(rptPath, report);
    }
    else {
        console.error('TEST REPORT: Root path not detected at ', rootPath);
    }
}
