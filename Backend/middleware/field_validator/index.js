import fs from 'fs'

import { validationResult } from 'express-validator'
import { sendBadRequest } from '../../utilities/response/index.js'

import logger from '../../utilities/logger.js'

export const validateField = async (req, res, next) => {
  try {
    const errors = validationResult(req)

    if (!errors.isEmpty()) {
      // Invalid Filed

      if (req.files) {
        const keys = Object.keys(req.files)
        for (const key of keys) {
          await deleteFiles(req.files[key])
        }
      }
      return sendBadRequest(res, errors.array()[0].msg, errors.array())
    }
    next()
  } catch (e) {
    logger.error('VALIDATE_FIELD')
    logger.error(e)
  }
}

export const deleteFiles = async (medias) => {
  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async (resolve, reject) => {
    try {
      for (const mediaDelete of medias) {
        await fs.unlinkSync(mediaDelete.path)
      }
      return resolve(true)
    } catch (e) {
      return reject(e)
    }
  })
}

export const deleteFile = async (url) => {
  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async (resolve, reject) => {
    try {
      await fs.unlinkSync(url)
      return resolve(true)
    } catch (e) {
      return reject(e)
    }
  })
}
