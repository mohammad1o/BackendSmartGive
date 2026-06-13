const router = require('express').Router();
const { 
  generateItemDescription, 
  detectItemCategory, 
  detectItemCondition,
  autoFillFromTitle,
  searchItems
} = require('../controllers/aiController');

router.post('/generate-description', generateItemDescription);
router.post('/detect-category', detectItemCategory);
router.post('/detect-condition', detectItemCondition);
router.post('/auto-fill', autoFillFromTitle);
router.post('/chat', searchItems);

module.exports = router;