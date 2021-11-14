
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
    // private directives:string[] = testDirectives

    listen(port:number = defaultPort):Promise<boolean> {
        return new Promise(resolve => {
            try {
                const wss = new WebSocketServer({port})
                wss.on('connection', (ws:WebSocket)=> {
                    this.ws = ws
                    ws.on('message', (message: RawData) => {
                        const str = message.toString()
                        this.handleResponse(str)
                    })
                })
            } catch(e:any) {
                console.warn(e.message)
            }
            // clear connection gate
            resolve(true)
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
        if(ract === 'end' && ans === '1000') {
            if(this.ws) this.ws.close(1000)
            if(process && process.exit) {
                console.log('Forcing exit on close')
                process.exit(0)
            }
        }
        console.log('response to '+ract+' = "'+ans+'"')
        this.responseResolver(ans)
    }
}
