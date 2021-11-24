
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
            const delta = pixelmatch(img1.data, img2.data, diff.data, width, height, {threshold: 0.1});
            const diffPath = imgPath1.substring(0, imgPath1.lastIndexOf('.')) + '-diff.png'
            fs.writeFileSync(diffPath, PNG.sync.write(diff));

            let tpix = width * height
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
                percentDiff: pct
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