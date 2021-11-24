import {JimpType} from "@jimp/core";

const fs = require('fs')
const path = require('path')
const pixelmatch = require('pixelmatch')
import Jimp from 'jimp/es'

export function compareImages(imgPath1:string, imgPath2:string, passingPct:number) {
    console.log('-->CompareImages ', imgPath1, imgPath2)
    return new Promise(resolve => {

        let data: any = {}
        let message:string;

        let img1: any = null;
        let img2: any = null;
        let pa = []
        // if(!fs.existsSync(imgPath1) || !fs.existsSync(imgPath2)) {
        //     message = 'image not available'
        // }
        try {
            pa.push(Jimp.read(imgPath1).then(image => {
                img1 = image;
            }).catch(e => {
                throw e
            }))
            pa.push(Jimp.read(imgPath2).then(image => {
                img2 = image;
            }).catch((e:any) => {
                throw e
            }))
        } catch(e:any) {
            message = e.toString()
        }
        Promise.resolve(pa).then(() => {
            let width = img1.width;
            let height = img1.height;
            if (img2.width !== width || img2.height !== height) {
                message = "Images are not the same size"

                // or
                // img2.scaleToFit(width,height)

                let dx = Math.abs(img2.width - width)
                let dy = Math.abs(img2.height - height)
                if (dx < dy) {
                    img2.resize(width, Jimp.AUTO)
                } else {
                    img2.resize(Jimp.AUTO, height)
                }
                img2.crop(0, 0, width, height)
            }
            let tpix = width * height;
            let diff = img2.clone()
            let delta = pixelmatch(img1.data, img2.data, diff.data, width, height, {threshold: 0.1});
            const diffPath = imgPath1.substring(0, imgPath1.lastIndexOf('.')) + '-diff.png'
            // fs.writeFileSync(diffPath, PNG.sync.write(diff));

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
            resolve(data)
        })
    })
}

export function compareToComp(imgName:string, passingPct:number) {

    let plat = 'electron'

    let imgPath1 = path.join('report', 'latest', 'images', imgName)
    let rp = fs.realpathSync(imgPath1)
    if(rp.indexOf('/mobile/') !== -1) plat = 'mobile'
    let imgPath2 = path.join('report', 'comp', plat, imgName)
    console.log(imgPath1, imgPath2, passingPct)
    return compareImages(imgPath1, imgPath2, passingPct)
}