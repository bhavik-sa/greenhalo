import multer from 'multer'
import logger from '../utilities/logger.js'
import { v4 as uuidv4 } from 'uuid'
import fs from 'fs'
const deckDownloadStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public')
  },
  filename: function (req, file, cb) {
    logger.log({ level: 'debug', message: req.body })
    cb(null, uuidv4() + '.' + file.originalname.split('.').pop())
  }
})

export const upload = multer({
  storage: deckDownloadStorage
})


