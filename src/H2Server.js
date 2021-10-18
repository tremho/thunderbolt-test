"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.H2Server = exports.setActionCallback = exports.waitToConnect = void 0;
const http2_1 = __importDefault(require("http2"));
let actionCallback;
let connectResolve;
function waitToConnect() {
    return new Promise(resolve => {
        connectResolve = resolve;
    });
}
exports.waitToConnect = waitToConnect;
function setActionCallback(action, cbResults) {
    actionCallback = {
        action: action,
        resolver: cbResults
    };
}
exports.setActionCallback = setActionCallback;
class H2Server {
    constructor() {
        this.port = 51610;
        this.downStream = null;
        this.count = 0;
        this.body = '';
        this.resolver = null;
        this.server = http2_1.default.createServer();
        this.server.on('error', (err) => { this.handleError(err); });
        this.server.on('stream', (stream, headers) => { this.handleStream(stream, headers); });
    }
    listen() {
        this.server.listen(this.port);
        console.log('listening on port ' + this.port);
    }
    handleClose() {
        console.log('server closed');
        process.exit(0);
    }
    handleError(err) {
        console.log(err);
    }
    sendDownstream(data) {
        if (this.downStream && data) {
            this.downStream.write(data + '\n');
        }
    }
    // handle an incoming request
    handleStream(stream, headers) {
        const chunks = [];
        if (stream.closed)
            return;
        if (headers[":path"] === '/test') {
            console.log('creating downstream');
            this.downStream = stream;
            this.downStream.on('close', () => { this.handleClose(); });
            if (connectResolve)
                connectResolve();
        }
        else if (headers[":path"] === '/status') {
            if (this.resolver)
                this.resolver(this.count++ + ': ' + this.body);
            stream.respond({ ':status': 200 });
            stream.end();
            const { action, resolver } = actionCallback || {};
            if (action && this.resolver !== resolver) {
                this.resolver = resolver;
                this.sendDownstream(action);
            }
        }
        stream.on('data', (chunk) => {
            chunks.push(chunk);
        });
        stream.on('end', () => {
            this.body = chunks.join('');
            chunks.splice(0, chunks.length);
        });
    }
}
exports.H2Server = H2Server;
