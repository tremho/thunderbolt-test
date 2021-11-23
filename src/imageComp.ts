
const fs = require('fs')
const path = require('path')
const PNG = require('pngjs').PNG
const pixelmatch = require('pixelmatch')

export function compareImages(imgPath1:string, imgPath2:string, passingPct:number) {
    console.log('-->CompareImages ', imgPath1, imgPath2)
    return new Promise(resolve => {

        const img1 = PNG.sync.read(fs.readFileSync(imgPath1));
        const img2 = PNG.sync.read(fs.readFileSync(imgPath2));
        const {width, height} = img1;
        const diff = new PNG({width, height});
        const delta = pixelmatch(img1.data, img2.data, diff.data, width, height, {threshold: 0.1});
        const diffPath = imgPath1.substring(0, imgPath1.lastIndexOf('.'))+'-diff.png'
        fs.writeFileSync(diffPath, PNG.sync.write(diff));

        let tpix = width*height
        let pct = 100*delta/tpix
        let ok = pct <= passingPct
        const data = {
            ok,
            message: (ok ? 'image matches' : 'image does not match') + ` (${pct} delta)`,
            percentDiff: pct,
            diffPath
        }

        resolve(delta)
    })
}

export function compareToComp(imgName:string, passingPct:number) {

    let imgPath1 = path.join('report', 'latest', 'images', imgName)
    let imgPath2 = path.join('report', 'comp', imgName)
    return compareImages(imgPath1, imgPath2, passingPct)
}