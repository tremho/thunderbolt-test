
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

export class WSServer {
    private ws?:WebSocket
    private responseResolver:any

    listen(port:number = defaultPort):Promise<boolean> {
        console.log('Test server listening...')
        return new Promise(resolve => {
            let wss
            try {
                wss = new WebSocketServer({port})
            } catch(e) {
                console.error("CAUGHT SERVER LISTEN: ", e)
            }
            if(wss) {
                wss.on('error', (e:Error) => {
                    if((e as any).code === 'EADDRINUSE') {
                        console.warn('Server is busy, please wait...')
                        return
                    }
                    console.error("WS SERVER ERROR", e)
                    resolve(false)
                })
                wss.on('connection', (ws:WebSocket)=> {
                    console.log('server see connection event')
                    this.ws = ws
                    ws.on('message', (message: RawData) => {
                        const str = message.toString()
                        this.handleResponse(str)
                    })
                    ws.on('close', (code: number) => {
                        console.log('Server sees a close event ', code)
                        this.responseResolver && this.responseResolver('')
                    })
                    // clear connection gate
                    resolve(true)
                })
            }
        })
    }

    sendDirective(action:string) {
        // console.log('server: sendDirective ', action)
        return new Promise(resolve => {
            const parts = action.split(' ')
            this.responseResolver = resolve
            if (this.ws) {
                this.ws.send(action)
            } else {
                this.responseResolver('')
            }
        })
    }
    handleResponse(res:string) {
        console.log('received response ', res)
        let n = res.indexOf(':')
        let rcount = Number(res.substring(0, n))
        res = res.substring(n+1)
        const parts = res.split('=')
        const ract = (parts[0] || '').trim()
        let ans = (parts[1] || '').trim()
        if( (ans.charAt(0) === '{' && ans.charAt(ans.length-1) === '}')
         || (ans.charAt(0) === '{' && ans.charAt(ans.length-1) === '}') ) {
            console.log("Converting JSON")
            try {
                ans = JSON.parse(ans)
            } catch(e) {
                console.warn(e)
            }
        }    
        if(ract === 'end') {
            console.log('Server gets an end response', ans, !!this.ws, !!process)
            if(this.ws) this.ws.close(Number(ans))
            if(process && process.exit) {
                console.log('Forcing cli to exit')
                process.exit(0)
            }
        }
        console.log('response to '+ract+' = "'+ans+'"')
        this.responseResolver(ans)
    }
}
