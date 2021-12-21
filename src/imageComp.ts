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
            let width = img1?.bitmap?.width;
            let height = img1?.bitmap?.height;

            let tpix:number, delta:number
            async function part2() {
                let diff;
                try {
                    tpix = width * height;
                    diff = img2.clone()
                    console.log(`images 0=${width}x${height} 1=${img1?.bitmap?.width}x${img1?.bitmap?.height} 2=${img2?.bitmap?.width}x${img2?.bitmap?.height} 3=${diff?.bitmap?.width}x${diff?.bitmap?.height}`)
                    let data1 = img1.bitmap.data; // await img1.getBufferAsync(Jimp.AUTO)
                    let data2 = img2.bitmap.data; // await img2.getBufferAsync(Jimp.AUTO)
                    let data3 = diff.bitmap.data; //await diff.getBufferAsync(Jimp.AUTO)
                    delta = pixelmatch(data1, data2, data3, width, height, {threshold: 0.1});
                } catch(e:any) {
                    data.error = 'err(2): '+e.toString()
                    if(data.error.toLowerCase().indexOf('sizes do not match') !== -1) {
                        data.error += ` (${img1.bitmap.width}x${img1.bitmap.height} vs ${img2.bitmap.width}x${img2.bitmap.height})`
                        const diffPath = imgPath1.substring(0, imgPath1.lastIndexOf('.')) + '-diff.png'
                        diff.write(diffPath, () => {
                            console.log('comp file written as diff', diffPath)
                        })
                    }
                    return resolve(data)
                }
                try {
                    const diffPath = imgPath1.substring(0, imgPath1.lastIndexOf('.')) + '-diff.png'
                    diff.write(diffPath, () => {
                        console.log('diff file written', diffPath)
                    })
                } catch(e:any) {
                    message = 'err(2.5): ' + e.toString()
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
                    message = 'err(3): '+e.toString()
                }
                console.log(`${delta} out of ${tpix} pixels differ (${pct}%) in ${width}x${height} image. okay=${ok}`)
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
    console.log('> compareToComp', imgName, passingPct)
    let imgPath1 = path.join('report', 'latest', 'images', imgName)
    let rp = fs.realpathSync(imgPath1)
    if(rp.indexOf('/mobile/') !== -1) plat = 'mobile'
    let imgPath2 = path.join('report', 'comp', plat, imgName)
    console.log(imgPath1, imgPath2, passingPct)
    return compareImages(imgPath1, imgPath2, passingPct)
}