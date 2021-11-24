
const fs = require('fs')
const path = require('path')
const PNG = require('pngjs').PNG
const pixelmatch = require('pixelmatch')

export function compareImages(imgPath1:string, imgPath2:string, passingPct:number) {
    console.log('-->CompareImages ', imgPath1, imgPath2)
    return new Promise(resolve => {

        let data:any = {}

        try {
            const img1 = PNG.sync.read(fs.readFileSync(imgPath1));
            const img2 = PNG.sync.read(fs.readFileSync(imgPath2));
            const {width, height} = img1;
            const diff = new PNG({width, height});
            console.log('images', img1, img2, diff)
            const delta = pixelmatch(img1.data, img2.data, diff.data, width, height, {threshold: 0.1});
            console.log('delta', delta)
            const diffPath = imgPath1.substring(0, imgPath1.lastIndexOf('.')) + '-diff.png'
            fs.writeFileSync(diffPath, PNG.sync.write(diff));

            let tpix = width * height
            let pct: any = 100 * delta / tpix
            let ok = pct <= passingPct
            pct = '' + pct
            pct = pct.substring(0, 8)
            console.log(`${delta} out of ${tpix} pixels differ (${pct}%) in ${width}x${height} image. okay=${ok}`)
            data = {
                ok,
                width,
                height,
                countDiff: delta,
                percentDiff: pct,
                diffPath
            }
        }
        catch(e) {
            console.error('error in compare', e)
            data.error = e.toString()
        }

        resolve(data)
    })
}

export function compareToComp(imgName:string, passingPct:number) {

    let plat = 'electron' // todo

    let imgPath1 = path.join('report', 'latest', 'images', imgName)
    let rp = fs.realpathSync(imgPath1)
    if(rp.indexOf('/mobile/') !== -1) plat = 'mobile'
    let imgPath2 = path.join('report', 'comp', plat, imgName)
    console.log(imgPath1, imgPath2, passingPct)
    return compareImages(imgPath1, imgPath2, passingPct)
}