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
exports.screenshot = exports.runRemoteTest = exports.endTest = exports.startTest = exports.callRemote = exports.testRemote = void 0;
const tap_1 = __importDefault(require("tap"));
const WSServer_1 = require("./WSServer");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
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
 * @returns {string} The JSON result of the action, Stringified
 */
function callRemote(action) {
    return __awaiter(this, void 0, void 0, function* () {
        // console.log('callRemote', action)
        return yield stream.sendDirective(action);
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
        console.log("%%%%%%%%%%%%%% startTest directive called %%%%%%%%%%%%%%%");
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
        console.log('endTest called', prevResolve);
        if (t)
            t.end();
        if (prevResolve) {
            console.log('ending previous flow gate');
            prevResolve();
        }
        if (!--runcount) {
            let report = yield stream.sendDirective('getReport');
            report = report.replace(/--/g, '=');
            saveReport(report);
        }
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
        count++;
        stream = new WSServer_1.WSServer();
        yield stream.listen();
        let res;
        let p = new Promise(resolve => {
            (0, WSServer_1.setEndResolver)(resolve);
        });
        return p.then(() => {
            return tap_1.default.test(title, (t) => {
                testFunc(t);
            });
        });
    });
}
exports.runRemoteTest = runRemoteTest;
let count = 0;
let pushers = [];
let queueTimer;
const testQueue = [];
function queueTheTest(title, testFunc) {
    testQueue.push({ title, testFunc });
}
function executeQueue() {
    return __awaiter(this, void 0, void 0, function* () {
        stream = new WSServer_1.WSServer();
        // await stream.listen()
        let runcount = 0;
        while (true) {
            let item = testQueue.shift();
            if (!item)
                break;
            // await stream.sendDirective('startReport '+(runcount++)+' "'+item.title+'"')
            pushers.push(tap_1.default.test(item.title, (t) => {
                console.log('running test Function for ' + item.title);
                item.testFunc(t);
            }));
        }
    });
}
/**
 * Takes a screenshot of the current page
 *
 * Image will be saved as a PNG in the appropriate report directory
 *
 * @param name Name to give this image
 */
function screenshot(name) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield callRemote('screenshot ' + name);
    });
}
exports.screenshot = screenshot;
function saveReport(report) {
    const rootPath = path_1.default.resolve('.');
    // console.log("TEST REPORT ROOT PATH", rootPath)
    if (fs_1.default.existsSync(path_1.default.join(rootPath, 'package.json'))) {
        const dtf = "current";
        const folderPath = path_1.default.join(rootPath, 'report', 'electron', dtf);
        fs_1.default.mkdirSync(folderPath, { recursive: true });
        const rptPath = path_1.default.join(folderPath, 'report.html');
        // console.log("TEST REPORT PATH", rptPath)
        fs_1.default.writeFileSync(rptPath, report);
    }
    else {
        console.error('TEST REPORT: Root path not detected at ', rootPath);
    }
}
