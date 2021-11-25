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
        let pa:Promise<void>[] = []
        if(fs.existsSync(imgPath1)) {
            pa.push(Jimp.read(imgPath1).then(image => {
                img1 = image;
            }))
        } else {
            data.error = 'image not found!'
            return resolve(data)
        }
        if(fs.existsSync(imgPath2)) {
            pa.push(Jimp.read(imgPath2).then(image => {
                img2 = image;
            }))
        } else {
            data.error = 'comp image not found!'
            return resolve(data)
        }
        Promise.all(pa).then(() => {
            let width = 0
            let height = 0
            try {
                width = img1.width;
                height = img1.height;
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
            } catch(e:any) {
                data.error = 'err(1): '+e.toString()
                return resolve(data)
            }
            let tpix:number, delta:number
            async function part2() {
                try {
                    tpix = width * height;
                    let diff = img2.clone()
                    let data1 = await img1.getBufferAsync(Jimp.AUTO)
                    let data2 = await img2.getBufferAsync(Jimp.AUTO)
                    let data3 = await diff.getBufferAsync(Jimp.AUTO)
                    delta = pixelmatch(data1, data2, data3, width, height, {threshold: 0.1});
                    const diffPath = imgPath1.substring(0, imgPath1.lastIndexOf('.')) + '-diff.png'
                    diff.write(diffPath, () => {console.log('diff file written', diffPath)})
                } catch(e:any) {
                    data.error = 'err(2): '+e.toString()
                    return resolve(data)
                }
            }

            Promise.resolve(part2()).then(() => {
                let ok, pct
                try {
                    pct = 100 * delta / tpix
                    ok = pct <= passingPct
                    pct = '' + pct
                    pct = pct.substring(0, 8)
                }
                catch(e:any) {
                    message = 'try3: '+e.toString()
                }
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