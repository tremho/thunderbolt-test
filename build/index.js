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
exports.runRemoteTest = exports.endTest = exports.startTest = exports.callRemote = exports.testRemote = void 0;
const tap_1 = __importDefault(require("tap"));
const H2Server_1 = require("./H2Server");
let desc, r, x;
let count = 0;
function puppetTest(action) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise(resolve => {
            H2Server_1.setActionCallback(action, (res) => {
                let n = res.indexOf(':');
                let rcount = Number(res.substring(0, n));
                res = res.substring(n + 1);
                const parts = res.split('=');
                const ract = (parts[0] || '').trim();
                const ans = (parts[1] || '').trim();
                if (ract === action.trim()) {
                    resolve(ans);
                }
            });
        });
    });
}
/**
 * Transact a single remote test action at the connected app client
 *
 * @param t The tap instance passed into test execution function from `runRemoteTest`
 * @param action The directive to perform
 * @param description A description of this test action
 * @param expected The expected return result of this test action
 */
function testRemote(t, action, description, expected) {
    return __awaiter(this, void 0, void 0, function* () {
        desc = description;
        x = '' + expected;
        r = yield puppetTest(action);
        t.ok(r === x, desc + ` expected ${x}, got ${r}`);
    });
}
exports.testRemote = testRemote;
/**
 * similar to `testRemote`, but simply calls the action and returns the result without submitting to test
 *
 * @param action The directive to perform
 * @returns {any} The result of the action
 */
function callRemote(action) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield puppetTest(action);
    });
}
exports.callRemote = callRemote;
/**
 * Should be called at the top of a test suite
 * It really only serves to synchronize subsequent test/returns, and can theoretically be called after the start also.
 * @param t The tap instance
 */
function startTest(t) {
    return __awaiter(this, void 0, void 0, function* () {
        desc = 'first connect';
        r = yield puppetTest('start');
        x = '';
        const ok = r === x;
        t.ok(ok, desc + ok ? ' successful' : ' FAILED');
    });
}
exports.startTest = startTest;
/**
 * Call when all the tests are complete.  The client will continue with its disposition after that, either exiting, or
 * continuing to run.
 * @param t The tap instance
 */
function endTest(t) {
    return __awaiter(this, void 0, void 0, function* () {
        t.end();
        puppetTest('end');
    });
}
exports.endTest = endTest;
/**
 * Initiate the connected test.  Pass the title of the test and the async function that conducts the test suite
 *
 * @param title Title of this test that will appear on the report
 * @param testFunc The function that conducts the test with `startTest` then a series of `testRemote` directives, then an `endTest`
 */
function runRemoteTest(title, testFunc) {
    return __awaiter(this, void 0, void 0, function* () {
        const stream = new H2Server_1.H2Server();
        stream.listen();
        return tap_1.default.test('Proof of concept walk-thru', t => {
            return H2Server_1.waitToConnect().then(() => {
                return testFunc(t);
            });
        });
    });
}
exports.runRemoteTest = runRemoteTest;
