const fs = require("fs")

module.exports = async function ( req, res, next ) {

    try {

        if(!req.files || Object.keys(req.files).length == 0 )
            return res.status(400).json({msg:"No files were uploaded!"})

        const file = req.files.file;
        console.log(file);
        if(file.size > 1024*1024) // 1mb
        {
            removeTmp(file.tempFilePath)

            return res.status(400).json({msg:"File size is too large!"})
        }
        if(file.mimetype !== 'image/jpeg') // jpg
        {
            removeTmp(file.tempFilePath)

            return res.status(400).json({msg:"File format is incorrect!"})
        }
        next()
    } catch (err) {
        return res.status(500).json({msg:err.message})
    }
}

const removeTmp = (path) => {
    fs.unlink(path, err => {
        if (err) throw err;
    })
}