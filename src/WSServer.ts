
// import http2 from "http2"
import {RawData, WebSocket, WebSocketServer} from 'ws'

const defaultPort = 51610

let actionCallback:any
let connectResolve:any

export function waitToConnect():Promise<void> {
    return new Promise(resolve => {
        connectResolve = resolve
    })
}

export function setActionCallback(action:string, cbResults:any) {
    actionCallback = {
        action:action,
        resolver:cbResults
    }
}

// export class H2Server {
//     server:any
//     port:number = 51610
//     downStream:any = null
//     count:number = 0
//     body:string = ''
//     resolver: any = null
//
//     constructor() {
//         this.server = http2.createServer()
//         this.server.on('error', (err:Error) => {this.handleError(err)})
//         this.server.on('stream',(stream:any, headers:any) => {this.handleStream(stream, headers)})
//     }
//     listen() {
//         this.server.listen(this.port)
//         console.log('listening on port '+this.port)
//     }
//     handleClose() {
//         console.log('server closed')
//         process.exit(0)
//     }
//
//     handleError(err:Error) {
//         console.log(err)
//     }
//
//     sendDownstream(data:string) {
//         if(this.downStream && data) {
//             this.downStream.write(data+'\n')
//         }
//     }
//
//     // handle an incoming request
//     handleStream(stream:any, headers:any) {
//         const chunks:string[] = []
//         if(stream.closed) return
//
//         if(headers[":path"] === '/test') {
//             console.log('creating downstream')
//             this.downStream = stream;
//             this.downStream.on('close', () => {this.handleClose()})
//
//             if(connectResolve) connectResolve()
//
//         } else if(headers[":path"] === '/status') {
//             if(this.resolver) this.resolver(this.count++ + ': ' + this.body)
//             stream.respond({':status': 200})
//             stream.end()
//             const {action, resolver} = actionCallback || {}
//             if(action  && this.resolver !== resolver) {
//                 this.resolver = resolver
//                 this.sendDownstream(action)
//             }
//         }
//         stream.on('data', (chunk:any) => {
//             chunks.push(chunk)
//         })
//         stream.on('end', () => {
//             this.body = chunks.join('')
//             chunks.splice(0, chunks.length)
//         })
//     }
// }

export class WSServer {
    private ws?:WebSocket
    private responseResolver:any
    // private directives:string[] = testDirectives

    listen(port:number = defaultPort):Promise<boolean> {
        console.log('>>>>>>>>>>>>>>   Starting server...')
        return new Promise(resolve => {
            const wss = new WebSocketServer({port})
            wss.on('connection', (ws:WebSocket)=> {
                console.log('>>>>>>>>>>>> server connected')
                this.ws = ws
                ws.on('message', (message:RawData) => {
                    const str = message.toString()
                    this.handleResponse(str)
                })
                // clear connection gate
                console.log('resolving promise now')
                resolve(true)
            })
            console.log('promise is unresolved yet')
        })
    }
    // runDirectives():Promise<void> {
    //     const looper = async ():Promise<void> => {
    //         const action = this.directives.shift()
    //         if (!action) {
    //             return Promise.resolve()
    //         }
    //         await this.sendDirective(action)
    //         return looper()
    //     }
    //     return looper()
    // }
    sendDirective(action:string) {
        console.log('server: sendDirective ', action)
        return new Promise(resolve => {
            this.responseResolver = resolve
            if(this.ws) {
                this.ws.send(action)
            } else {
                this.responseResolver('')
            }
        })
    }
    handleResponse(res:string) {
        let n = res.indexOf(':')
        let rcount = Number(res.substring(0, n))
        res = res.substring(n+1)
        const parts = res.split('=')
        const ract = (parts[0] || '').trim()
        let ans = (parts[1] || '').trim()
        if( (ans.charAt(0) === '{' && ans.charAt(ans.length-1) === '}')
         || (ans.charAt(0) === '{' && ans.charAt(ans.length-1) === '}') ) {
            try {
                ans = JSON.parse(ans)
            } catch(e) {
                console.warn(e)
            }
        }    
        if(ract === 'end' && ans === '1000') {
            if(this.ws) this.ws.close(1000)
            if(process && process.exit) process.exit(0)
        }
        // console.log('response to '+ract+' = "'+ans+'"')
        this.responseResolver(ans)
    }
}
