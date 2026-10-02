const express = require('express');

const {
    createEvent,
    getEventsByProject,
    updateEvent,
    deleteEvent,
} = require('../controllers/calendarEventController');

const { verifyFirebaseToken } = require('../middleware');

const router = express.Router();

// Create a new calendar event.
router.post(
    '/',
    verifyFirebaseToken,
    createEvent
);

// Get all calendar events belonging to a project.
router.get(
    '/project/:projectId',
    verifyFirebaseToken,
    getEventsByProject
);

// Update a calendar event.
router.put(
    '/:eventId',
    verifyFirebaseToken,
    updateEvent
);

// Delete a calendar event.
router.delete(
    '/:eventId',
    verifyFirebaseToken,
    deleteEvent
);

module.exports = router;
