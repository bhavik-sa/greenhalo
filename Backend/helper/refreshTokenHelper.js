import jwt from 'jsonwebtoken'
import config from '../config/index.js'
export const generateRefreshToken = (data, role) => {
 
  switch (role) {
    case 'ADMSTR':
      return jwt.sign(data, config.ADMSTR_REFRESH_SECRET, { expiresIn: '1d' })
    case 'SUPER_ADMIN':
      return jwt.sign(data, config.SUPER_ADMIN_REFRESH_SECRET, { expiresIn: '1d' })
    case 'ADMIN':
      return jwt.sign(data, config.ADMIN_REFRESH_SECRET, { expiresIn: '1d' })
    case 'SUPER_MASTER':
      return jwt.sign(data, config.SUPER_MASTER_REFRESH_SECRET, { expiresIn: '1d' })
    case 'MASTER':
      return jwt.sign(data, config.MASTER_REFRESH_SECRET, { expiresIn: '1d' })
    case 'USER':
      return jwt.sign(data, config.USER_REFRESH_SECRET, { expiresIn: '1d' })
    default:
      return null
  }
}

export const validateRefreshToken = async (token, role) => {
  try {
    const tokenInfo = await jwt.verify(token, config[`${role}_REFRESH_SECRET`])
    return tokenInfo
  } catch (e) {
    return null
  }
}
