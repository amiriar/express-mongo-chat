/**
 * @swagger
 * tags:
 *  name: Auth
 *  description: Auth module and routes
 */

/**
 * @swagger
 * components:
 *   schemas:
 *    register:
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
 */

/**
 * @swagger
 * 
 * /api/auth/register:
 *  post:
 *   summary: Register a new user and send OTP
 *   tags:
 *      - Auth
 *   requestBody:
 *    content:
 *     application/x-www-form-urlencoded:
 *      schema:
 *       $ref: '#/components/schemas/register'
 *     application/json:
 *      schema:
 *       $ref: '#/components/schemas/register'
 *   responses:
 *    200:
 *     description: OTP sent to the user's phone
 */

/**
 * @swagger
 * 
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
 *     description: Successful login and returns access token
 */

/**
 * @swagger
 * 
 * /api/auth/logout:
 *  get:
 *   summary: Logout the user
 *   tags:
 *    - Auth
 *   responses:
 *    200:
 *     description: Successful logout
 */
