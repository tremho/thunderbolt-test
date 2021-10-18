
import http2 from "http2"


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

export class H2Server {
    server:any
    port:number = 51610
    downStream:any = null
    count:number = 0
    body:string = ''
    resolver: any = null

    constructor() {
        this.server = http2.createServer()
        this.server.on('error', (err:Error) => {this.handleError(err)})
        this.server.on('stream',(stream:any, headers:any) => {this.handleStream(stream, headers)})
    }
    listen() {
        this.server.listen(this.port)
        console.log('listening on port '+this.port)
    }
    handleClose() {
        console.log('server closed')
        process.exit(0)
    }

    handleError(err:Error) {
        console.log(err)
    }

    sendDownstream(data:string) {
        if(this.downStream && data) {
            this.downStream.write(data+'\n')
        }
    }

    // handle an incoming request
    handleStream(stream:any, headers:any) {
        const chunks:string[] = []
        if(stream.closed) return

        if(headers[":path"] === '/test') {
            console.log('creating downstream')
            this.downStream = stream;
            this.downStream.on('close', () => {this.handleClose()})

            if(connectResolve) connectResolve()

        } else if(headers[":path"] === '/status') {
            if(this.resolver) this.resolver(this.count++ + ': ' + this.body)
            stream.respond({':status': 200})
            stream.end()
            const {action, resolver} = actionCallback || {}
            if(action  && this.resolver !== resolver) {
                this.resolver = resolver
                this.sendDownstream(action)
            }
        }
        stream.on('data', (chunk:any) => {
            chunks.push(chunk)
        })
        stream.on('end', () => {
            this.body = chunks.join('')
            chunks.splice(0, chunks.length)
        })
    }

}