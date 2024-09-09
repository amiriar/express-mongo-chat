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
 *             firstname:
 *               type: string
 *               description: firstname of the user
 *             lastname:
 *               type: string
 *               description: lastname of the user
 *             username:
 *               type: string
 *               description: Username of the user
 *             email:
 *               type: string
 *               description: Email of the user
 *             profile:
 *               type: string
 *               format: binary
 *               description: Profile image of the user uploaded as a file
 *             bio:
 *               type: string
 *               description: A brief bio of the user
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
