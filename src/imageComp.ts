
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
            let tpix = width * height
            let diff = new PNG({width, height});
            let delta;
            let message = ''
            if(width !== img2.width || height !== img2.height) {
                const area2 = (img2.width || 0)  * (img2.height || 0)
                delta = Math.abs(area2 - tpix)
                diff = img2 // write the mismatched comp image as the diff
                message = 'images are not the same size'
            } else {
                delta = pixelmatch(img1.data, img2.data, diff.data, width, height, {threshold: 0.1});
            }
            const diffPath = imgPath1.substring(0, imgPath1.lastIndexOf('.')) + '-diff.png'
            fs.writeFileSync(diffPath, PNG.sync.write(diff));

            let pct: any = 100 * delta / tpix
            let ok = pct <= passingPct
            pct = '' + pct
            pct = pct.substring(0, 8)
            // console.log(`${delta} out of ${tpix} pixels differ (${pct}%) in ${width}x${height} image. okay=${ok}`)
            data = {
                ok,
                width,
                height,
                countDiff: delta,
                percentDiff: pct,
                error: message
            }
        }
        catch(e:any) {
            data.error = e.toString()
            data.width = data.height = 0
            data.percentDiff = 100
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