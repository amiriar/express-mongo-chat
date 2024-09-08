/**
 * @swagger
 * tags:
 *  name: Dashboard
 *  description: Dashboard module and routes
 */


/**
 * @swagger
 *  components:
 *      schemas:
 *         UpdateUserDashboard:
 *           type: object
 *           properties:
 *             firstName:
 *               type: string
 *               description: First name of the user
 *             lastName:
 *               type: string
 *               description: Last name of the user
 *             username:
 *               type: string
 *               description: Username of the user
 *             email:
 *               type: string
 *               description: Email of the user
 *             age:
 *               type: number
 *               description: Age of the user
 *             job:
 *               type: string
 *               description: Job title of the user
 *             phoneNumber:
 *               type: string
 *               description: Phone number of the user
 *             education:
 *               type: string
 *               description: Education level or background of the user
 *             isStudent:
 *               type: boolean
 *               description: Indicator whether the user is a student
 *             profile:
 *               type: string
 *               format: binary
 *               description: Profile image of the user uploaded as a file
 *             description:
 *               type: string
 *               description: Brief description of the user
 *             linkedin:
 *               type: string
 *               description: LinkedIn profile URL of the user
 *             pinterest:
 *               type: string
 *               description: Pinterest profile URL of the user
 *             twitterX:
 *               type: string
 *               description: Twitter handle of the user
 *             facebook:
 *               type: string
 *               description: Facebook profile URL of the user
 */


/**
 * @swagger
 * 
 * /api/dashboard/whoami:
 *  get:
 *   summary: Get information about the current user
 *   tags:
 *    - Dashboard
 *   responses:
 *    200:
 *     description: User information successfully retrieved
 */

/**
 * @swagger
 *  /api/dashboard:
 *      post:
 *          tags:
 *              - Dashboard
 *          summary: Update user profile
 *          requestBody:
 *              required: true
 *              content:
 *                  multipart/form-data:
 *                      schema:
 *                          $ref: '#/components/schemas/UpdateUserDashboard'
 *          responses:
 *              200:
 *                  description: User profile successfully updated
 */
