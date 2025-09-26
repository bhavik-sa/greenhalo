import { sendBadRequest, sendBadRequestWith406Code } from '../../utilities/response/index.js'
import messages from '../../utilities/messages.js'
import { returnTokenError, validateAccessToken } from '../../helper/accessTokenHelper.js'
import { UserModel } from '../../model/UserModel.js'
import constant from '../../utilities/constant.js'


export const isAdmin = async (req, res, next, type = 1) => {
  try {
    // find token in headers
    const bearerToken = req.headers.authorization

    if (!bearerToken) return sendBadRequestWith406Code(res, messages.authTokenRequired)
    
    const tokenInfo = await validateAccessToken(String(bearerToken).split(' ')[1], 'ADMIN')


    if(!tokenInfo){
      return sendBadRequestWith406Code(res, messages.tokenExpiredError)
    }
    // token and token id find n  ext step
    if (!tokenInfo && !tokenInfo._id) return sendBadRequestWith406Code(res, messages.tokenFormatInvalid)

    const adminDetails = await UserModel.findOne(
      { _id: tokenInfo._id },
      {
        _id: 1,
        role: 1,
        username: 1,   
        profile_url: 1,      
      }
    )
    if (!adminDetails) {
      return sendBadRequestWith406Code(res, messages.adminNotFound)
    }
    if (adminDetails.role !== constant.ROLE[0]) {
      return sendBadRequestWith406Code(res, messages.InvalidAdmin)
    }
    // if (!adminDetails.accessTokenID) return sendBadRequestWith406Code(res, messages.AccessTokenAlreadyInUse)
    // if (adminDetails.accessTokenID !== tokenInfo.accessTokenID) return sendBadRequestWith406Code(res, messages.accessTokenIsNotValid)
    // if (!adminDetails.status) return sendBadRequestWith406Code(res, messages.accountBlocked)
    // if (adminDetails.deleted) return sendBadRequestWith406Code(res, messages.accountDeleted)

    // Attach Admin Info
    req.user = adminDetails
    // next for using this method only
    next()
  } catch (e) {
    const error = await returnTokenError(e, 'IS_ADMIN')
    if (error !== messages.somethingGoneWrong) {
      return sendBadRequestWith406Code(res, error)
    } else {
      return sendBadRequest(res, error)
    }
  }
}