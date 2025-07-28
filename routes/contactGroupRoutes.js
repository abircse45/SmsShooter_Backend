const express = require('express');
const router = express.Router();
const {
  createContactGroup,
  getAllContactGroups,
  getSingleContactGroup,
  updateContactGroup,
  deleteContactGroup,
  addContactsToGroup,
  removeContactsFromGroup,
  getGroupStats
} = require('../controllers/contactGroupController');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Group CRUD operations
router.post('/', createContactGroup);                           // POST /api/contact-groups
router.get('/', getAllContactGroups);                           // GET /api/contact-groups
router.get('/stats', getGroupStats);                            // GET /api/contact-groups/stats
router.get('/:groupId', getSingleContactGroup);                 // GET /api/contact-groups/:groupId
router.put('/:groupId', updateContactGroup);                    // PUT /api/contact-groups/:groupId
router.delete('/:groupId', deleteContactGroup);                 // DELETE /api/contact-groups/:groupId

// Contact management within groups
router.post('/:groupId/contacts', addContactsToGroup);          // POST /api/contact-groups/:groupId/contacts
router.delete('/:groupId/contacts', removeContactsFromGroup);   // DELETE /api/contact-groups/:groupId/contacts

module.exports = router;
