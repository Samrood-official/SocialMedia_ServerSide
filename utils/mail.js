  const generateOTp = ()=>{
    let otp = '';
    
    for(let i=0; i<4; i++){
        let ranVal = Math.round(Math.random()*9);
        otp = otp+ranVal
    }

    return otp
}
export default generateOTp