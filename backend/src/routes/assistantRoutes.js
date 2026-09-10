/**
 * @file assistantRoutes.js
 * @description Express routing definitions for the AeroInsight AI Flight Assistant Copilot.
 */

const express = require('express');
const router = express.Router();
const assistantController = require('../controllers/assistantController');

/**
 * POST /api/assistant/chat
 * Dispatches conversational queries to Gemini and coordinates autonomous Unity MCP simulation triggers.
 */
router.post('/chat', assistantController.handleAssistantMessage);

module.exports = router;
