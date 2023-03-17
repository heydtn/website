class OSNodeInstance {
  private local: string = crypto.randomUUID()
  private bc: BroadcastChannel = new BroadcastChannel('node-gossip')
  private remoteNodes: Map<string, number> = new Map()
  private heartbeatInterval: number | null = null
  private debug: boolean
  private debugInterval: number | null = null
  private started: boolean = false

  private sendHeart() {
    this.bc.postMessage({ op: 'heart', nid: this.local })
  }

  private listener(event: MessageEvent<any>) {
    switch (event.data.op) {
      case 'leave':
        clearTimeout(this.remoteNodes.get(event.data?.nid))
        this.remoteNodes.delete(event.data?.nid)
        break
      case 'heart':
        if (event.data.nid === null || event.data.nid === undefined) {
          break
        }

        clearTimeout(this.remoteNodes.get(event.data.nid))
        if (!this.remoteNodes.has(event.data.nid)) {
          console.log('new node joining', event.data.nid)
        }

        this.remoteNodes.set(
          event.data.nid,
          setTimeout(() => {
            this.remoteNodes.delete(event.data.nid)
            console.log('node undiscoverable', event.data.nid)
          }, 1000)
        );
        break;
    }
  }

  private startListener() {
    this.bc.addEventListener('message', this.listener)
  }

  private stopListener() {
    this.bc.removeEventListener('message', this.listener)
  }

  private startHeart() {
    this.sendHeart()
    this.heartbeatInterval = setInterval(this.sendHeart, 400)
  }

  private stopHeart() {
    clearInterval(this.heartbeatInterval!)
    this.heartbeatInterval = null
  }

  private maybeStartDebug() {
    if (this.debug) {
      this.debugInterval = setInterval(() => {
        console.log('active remote nodes:', Array.from(this.remoteNodes.keys()));
      }, 3000);
    }
  }

  private maybeStopDebug() {
    clearInterval(this.debugInterval!)
  }

  private clearNodes() {
    this.remoteNodes.clear()
  }

  constructor(debug: boolean = false) {
    this.debug = debug
  }

  start() {
    if (!this.started) {
      this.startListener()
      this.startHeart()
      this.maybeStartDebug()
      this.started = true
    }
  }

  stop() {
    if (this.started) {
      this.stopListener()
      this.stopHeart()
      this.maybeStopDebug()
      this.clearNodes()
      this.started = false
    }
  }
}

export const OSNode: OSNodeInstance = new OSNodeInstance(true)
