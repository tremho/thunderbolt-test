
const {resemble} = require('@mirzazeyrek/node-resemble-js')
const path = require('path')

export function compareImages(imgPath1:string, imgPath2:string) {
    return new Promise(resolve => {
    const api = resemble(imgPath1).compareTo(imgPath2)
        .ignoreAntialiasing()
        .onComplete((data:any) => {
            console.log(data)
            resolve(data)
        })
    })
}

export function compareToComp(imgName:string) {

    let imgPath1 = path.join('report', 'latest', 'images', imgName)
    let imgPath2 = path.join('report', 'comp', imgName)
    return compareImages(imgPath1, imgPath2)
}