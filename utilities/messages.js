const messages = {
    // required fields
    somethingGoneWrong: 'Something went wrong',
    passwordChanged: 'Password changed successfully',
    nameIsRequired: 'Name is required',
    IDIsRequired: 'ID is required',
    passwordIsRequired: 'Password is required',
    DomainIsRequired: 'Domain is required',
    allowedExchange: 'Exchange is required',
    exchangeGroupIsRequired: 'Exchange group is required',
    leverageXIsRequired: 'leverage X is required',
    leverageYIsRequired: 'leverage Y is required',
    insertCustomBetIsRequired: 'Insert customBet is required',
    editBetIsRequired: 'Edit Bet is required',
    deleteBetIsRequired: 'Delete Bet is required',
    limitOfAddSuperMasterIsRequired: 'Limit of add super master is required',
    limitOfAddMasterIsRequired: 'Limit of add master is required',
    limitOfAddUserIsRequired: 'Limit of add user is required',
    brokerageIsRequired: 'Brokerage is required',
    investorPasswordIsRequired: 'Investor password is required',
    YouAreNotAuthenticated: 'You are not authenticated',
    YouAreNotAccessibleToDoThis: 'You are not accessible to do This.',
    userNotFound: 'User not found',
    NameUpdated: 'Name updated',
  
    // id
    idAlreadyExist: 'ID already exist',
    idAvailable: 'ID available',
  
    // admin
    adminAdded: 'Admin added successfully',
    adminNotFound: 'Admin not found',
    InvalidAdmin: 'you are not authorized to perform this action.',
    invalidPassword: 'Invalid password',
    adminLoggedIn: 'login in successfully',
    adminAlreadyExist: 'Admin already exist',
    accountDeactivated: 'Account deactivated',
    inValidId: 'Invalid ID',
    inValidOtp: 'Invalid OTP',
    inValidEmail: 'Invalid email',
  
    // broker
    brokerAlreadyExist: 'Broker already exist',
    brokerAdded: 'Broker added successfully',
  
    // user
    userAlreadyExist: 'User already exist',
    userAdded: 'User added successfully',
    userRegistered: 'User registered successfully',
    userLoggedIn: 'User logged in successfully',
    invalidUser: 'Invalid user',
    profileFetched: 'Profile fetched successfully',
    profileUpdated: 'Profile updated successfully',
    
    // mfa
    mfaNotEnabled: 'Multi-factor authentication is not enabled for this user',
    mfaMethodNotSupported: 'MFA method not supported',
    mfaCodeSent: 'MFA code sent successfully',
    mfaCodeVerified: 'MFA code verified successfully',
    mfaCodeInvalid: 'Invalid MFA code',
    mfaCodeExpired: 'MFA code expired',
  
    // token
    authTokenRequired: 'Auth token required',
    tokenFormatInvalid: 'Token format invalid',
    tokenExpiredError: 'Token expired',
    invalidToken: 'Invalid token',
  
    // symbol
    symbolNameIsRequired: 'Symbol name is required',
    symbolNameIsAlreadyExists: 'Symbol name is already exists',
    symbolNotCreated: 'Symbol not created',
    symbolCreated: 'Symbol created',
    symbolNotFound: 'Symbol not found',
    symbolUpdated: 'Symbol updated',
    ThisNameIsAlreadyTaken: 'This name is already taken',
    symbolDeleted: 'symbol deleted',
  
    // exchange
    exchangeNameIsRequired: 'Exchange name is required',
    exchangeIsAlreadyExist: 'Exchange is already exists',
    symbolIsAlreadyTaken: 'Symbol is already taken',
    exchangeCreated: 'Exchange created',
    exchangeNotFound: 'Exchange not found',
    exchangeUpdated: 'Exchange updated',
    exchangeDeleted: 'Exchange deleted',
    symbolsAddedInExchange: 'Symbols added in exchange',
    symbolIsNotExistInExchangeDetails: 'Symbols not found in exchange',
    symbolsRemovedInExchange: 'Symbols removed in exchange',
    
    // Password reset
    resetLinkSent: 'If your email is registered, you will receive a password reset link',
    passwordResetSuccess: 'Password has been reset successfully',
    invalidResetToken: 'Invalid or expired reset token',
    resetTokenRequired: 'Reset token is required',
    newPasswordRequired: 'New password is required',
    passwordResetError: 'Error processing password reset request',
    passwordMustHave8CharacterLong: 'Password must have 8 characters long',
    passwordFormatIsNotValid: 'Password format is not valid',




    searchMustBeAString: 'Search must be a string',
    userUpdated: 'User updated successfully',

    reportSubmitted: 'Report submitted successfully',
    alreadyReported: 'You have already reported this user',
    cannotReportSelf: 'You cannot report yourself',

    reportAlreadyUpdated: 'Report already updated',
    reportNotFound: 'Report not found',
    reportUpdated: 'Report updated successfully',

    emailAlreadyExist: 'Email already exist',
    mediaIsRequired: 'Media url is required',
    mediaNotFound: 'Media not found. To create a new media entry, please provide both the media file and type.',
    badgeNotFound: 'Badge not found',
    badgeCreated: 'Badge created successfully',
    iconIsRequired: 'Icon is required',
    badgeUpdated: 'Badge updated successfully',
    badgeDeleted: 'Badge deleted successfully', 
    invalidType: 'Invalid type',
    checkinChampCreated: 'Checkin Champ created successfully',
    badgeAssignedToUserSuccessfully: 'Badge assigned to user successfully',
    badgeRemovedFromUserSuccessfully: 'Badge removed from user successfully',
    userAlreadyHasThisBadge: 'User already has this badge',
    userDoesNotHaveThisBadge: 'User does not have this badge',
    saferDatingBadgeCreated: 'Safer Dating Badge created successfully',
    socialSaferDatingBadgeCreated: 'Social Safer Dating Badge created successfully',
    halodBadgeCreated: 'Halod Badge created successfully',
    greenHaloBadgeCreated: 'Green Halo Badge created successfully',
    socialConnectBadgeCreated: 'Social Connect Badge created successfully',
    greenFlaggedBadgeCreated: 'Green Flagged Badge created successfully',

    pageNameAlreadyExists: 'Page name already exists',
    cmsPageCreatedSuccessfully: 'CMS page created successfully',
    cmsPageUpdatedSuccessfully: 'CMS page updated successfully',
    cmsPageDeletedSuccessfully: 'CMS page deleted successfully',
    cmsPageNotFound: 'CMS page not found',


    contactSubmitted: 'Contact submitted successfully',
    contactRequestNotFound: 'Contact request not found',
    contactRequestRetrievedSuccessfully: 'Contact request retrieved successfully',
    contactRequestsRetrievedSuccessfully: 'Contact requests retrieved successfully',
    responseSentSuccessfully: 'Response sent successfully',


    // route messages
    userIdIsRequired: 'User ID is required',
    badgeIdIsRequired: 'Badge ID is required',
    titleMustBeAString: 'Title must be a string',
    typeMustBeAString: 'Type must be a string',
    invalidUserId: 'Invalid user ID',
    invalidUsername: 'Invalid username',
    invalidEmail: 'Invalid email',
    invalidSubscription: 'Invalid subscription',
    invalidRole: 'Invalid role',
    invalidStatus: 'Invalid status',
    pageMustBeAPositiveInteger: 'Page must be a positive integer',
    limitMustBeBetween1And100: 'Limit must be between 1 and 100',
    invalidStartDate: 'Invalid start date format. Use YYYY-MM-DD',
    invalidEndDate: 'Invalid end date format. Use YYYY-MM-DD',

    invalidReportId: 'Invalid report ID',
    reportIdIsRequired: 'Report ID is required',
    statusIsRequired: 'Status is required',

    adminCommentIsRequired: 'Admin comment is required',

    titleIsRequired: 'Title is required',
    htmlContentIsRequired: 'HTML content is required',

    saferDatingIdIsRequired: 'Safer dating ID is required',
    invalidSaferDatingId: 'Invalid safer dating ID',
    typeIsRequired: 'Type is required',
    invalidMediaType: 'Invalid media type',

    invalidBadgeId: 'Invalid badge ID',

    statusMustBeABoolean: 'Status must be a boolean',
    htmlContentMustBeAString: 'HTML content must be a string',

    pageIdIsRequired: 'Page ID is required',
    invalidCmsPageId: 'Invalid CMS page ID',
    pageNameIsRequired: 'Page name is required',
    pageNameMustBeAString: 'Page name must be a string',
    contentIsRequired: 'Content is required',
    contentMustBeAString: 'Content must be a string',


    invalidContactRequestId: 'Invalid contact request ID',

    responseIsRequired: 'Response is required',
    responseMustBeBetween10And5000Characters: 'Response must be between 10 and 5000 characters',
    
};

export default messages;