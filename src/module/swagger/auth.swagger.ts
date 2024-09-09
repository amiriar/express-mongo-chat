/**
 * @swagger
 * tags:
 *  name: Auth
 *  description: Authentication module and routes
 */

/**
 * @swagger
 * components:
 *   schemas:
 *    sendOtp:
 *     type: object
 *     required:
 *      - phone
 *     properties: 
 *      phone:
 *       type: string
 *       description: Phone number of the user
 *  
 *    login:
 *     type: object
 *     required:
 *      - phone
 *      - otp
 *     properties: 
 *      phone:
 *       type: string
 *       description: Phone number of the user
 *      otp:
 *       type: string
 *       description: OTP code sent to the user's phone
 *    
 *    refreshToken:
 *     type: object
 *     required:
 *      - refreshToken
 *     properties: 
 *      refreshToken:
 *       type: string
 *       description: Refresh token to generate a new access token
 */

/**
 * @swagger
 * /api/auth/send-otp:
 *  post:
 *   summary: Send OTP to the user's phone
 *   tags:
 *    - Auth
 *   requestBody:
 *    content:
 *     application/x-www-form-urlencoded:
 *      schema:
 *       $ref: '#/components/schemas/sendOtp'
 *     application/json:
 *      schema:
 *       $ref: '#/components/schemas/sendOtp'
 *   responses:
 *    200:
 *     description: OTP sent to the user's phone
 *    400:
 *     description: Bad request
 *    500:
 *     description: Server error
 */

/**
 * @swagger
 * /api/auth/login:
 *  post:
 *   summary: Login using OTP
 *   tags:
 *    - Auth
 *   requestBody:
 *    content:
 *     application/x-www-form-urlencoded:
 *      schema:
 *       $ref: '#/components/schemas/login'
 *     application/json:
 *      schema:
 *       $ref: '#/components/schemas/login'
 *   responses:
 *    200:
 *     description: Successful login, returns access token
 *    401:
 *     description: Invalid credentials or OTP
 *    400:
 *     description: Bad request
 *    500:
 *     description: Server error
 */

/**
 * @swagger
 * /api/auth/logout:
 *  get:
 *   summary: Logout the user
 *   tags:
 *    - Auth
 *   responses:
 *    200:
 *     description: Successfully logged out
 *    400:
 *     description: Bad request
 *    500:
 *     description: Server error
 */

/**
 * @swagger
 * /api/auth/refresh-token:
 *  post:
 *   summary: Refresh access token using a valid refresh token
 *   tags:
 *    - Auth
 *   requestBody:
 *    content:
 *     application/x-www-form-urlencoded:
 *      schema:
 *       $ref: '#/components/schemas/refreshToken'
 *     application/json:
 *      schema:
 *       $ref: '#/components/schemas/refreshToken'
 *   responses:
 *    200:
 *     description: Successfully refreshed the access token
 *    401:
 *     description: Invalid or missing refresh token
 *    500:
 *     description: Server error
 */
