import multer from "multer";


// multer is middleware for handling a multiple file uploader
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './public/temp')  // cb is callback function
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname)
    }
  })
  
  const upload = multer({ 
    // storage: storage

    // in es6 we achieve same result like this
    
    storage

})