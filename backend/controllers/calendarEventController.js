const { findUserByFirebaseUid } = require('../models/userModel');
const { findProjectMemberRole } = require('../models/projectModel');

const {
    createCalendarEvent,
    findCalendarEventById,
    findCalendarEventsByProject,
    updateCalendarEvent,
    deleteCalendarEvent,
} = require('../models/calendarEventModel');

// Check that an ID is a positive whole number.
const isValidId = (value) => {
    return /^[1-9]\d*$/.test(String(value));
};

// Check that a date value is valid.
const isValidDate = (value) => {
    if (typeof value !== 'string' || !value.trim()) {
        return false;
    }

    return !Number.isNaN(Date.parse(value));
};

// Validate calendar event fields.
const validateEventFields = (
    eventTitle,
    eventDescription,
    startDatetime,
    endDatetime
) => {
    if (
        typeof eventTitle !== 'string' ||
        !eventTitle.trim()
    ) {
        return 'Event title is required.';
    }

    if (eventTitle.trim().length > 255) {
        return 'Event title must be 255 characters or fewer.';
    }

    if (
        eventDescription !== undefined &&
        eventDescription !== null &&
        typeof eventDescription !== 'string'
    ) {
        return 'Event description must be a string.';
    }

    if (!isValidDate(startDatetime)) {
        return 'A valid startDatetime is required.';
    }

    if (
        endDatetime !== undefined &&
        endDatetime !== null &&
        !isValidDate(endDatetime)
    ) {
        return 'endDatetime must be a valid date.';
    }

    if (
        endDatetime !== undefined &&
        endDatetime !== null &&
        new Date(endDatetime) < new Date(startDatetime)
    ) {
        return 'endDatetime cannot be before startDatetime.';
    }

    return null;
};

// Create a calendar event.
const createEvent = async (req, res) => {
    const firebaseUid = req.user?.uid;

    if (!firebaseUid) {
        return res.status(401).json({
            message: 'Unauthorized.',
        });
    }

    const {
        projectId,
        eventTitle,
        eventDescription,
        startDatetime,
        endDatetime,
    } = req.body || {};

    if (!isValidId(projectId)) {
        return res.status(400).json({
            message: 'projectId must be a valid number.',
        });
    }

    const validationError = validateEventFields(
        eventTitle,
        eventDescription,
        startDatetime,
        endDatetime
    );

    if (validationError) {
        return res.status(400).json({
            message: validationError,
        });
    }

    try {
        // Find the Mosalinx user connected to Firebase.
        const user = await findUserByFirebaseUid(firebaseUid);

        if (!user) {
            return res.status(404).json({
                message:
                    'Authenticated user is not registered in the database.',
            });
        }

        // Verify that the user belongs to the project.
        const role = await findProjectMemberRole(
            projectId,
            user.user_id
        );

        if (!role) {
            return res.status(403).json({
                message: 'You are not a member of this project.',
            });
        }

        const event = await createCalendarEvent(
            projectId,
            user.user_id,
            eventTitle.trim(),
            typeof eventDescription === 'string'
                ? eventDescription.trim()
                : null,
            startDatetime,
            endDatetime || null
        );

        return res.status(201).json({
            event,
        });
    } catch (error) {
        console.error('Error creating calendar event:', error);

        return res.status(500).json({
            message: 'Failed to create calendar event.',
        });
    }
};

// Get all calendar events for a project.
const getEventsByProject = async (req, res) => {
    const { projectId } = req.params;
    const firebaseUid = req.user?.uid;

    if (!isValidId(projectId)) {
        return res.status(400).json({
            message: 'projectId must be a valid number.',
        });
    }

    if (!firebaseUid) {
        return res.status(401).json({
            message: 'Unauthorized.',
        });
    }

    try {
        // Find the Mosalinx user connected to Firebase.
        const user = await findUserByFirebaseUid(firebaseUid);

        if (!user) {
            return res.status(404).json({
                message:
                    'Authenticated user is not registered in the database.',
            });
        }

        // Verify that the user belongs to the project.
        const role = await findProjectMemberRole(
            projectId,
            user.user_id
        );

        if (!role) {
            return res.status(403).json({
                message: 'You are not a member of this project.',
            });
        }

        const events = await findCalendarEventsByProject(
            projectId
        );

        return res.status(200).json({
            events,
        });
    } catch (error) {
        console.error('Error retrieving calendar events:', error);

        return res.status(500).json({
            message: 'Failed to retrieve calendar events.',
        });
    }
};

// Update a calendar event.
const updateEvent = async (req, res) => {
    const { eventId } = req.params;
    const firebaseUid = req.user?.uid;

    if (!isValidId(eventId)) {
        return res.status(400).json({
            message: 'eventId must be a valid number.',
        });
    }

    if (!firebaseUid) {
        return res.status(401).json({
            message: 'Unauthorized.',
        });
    }

    const {
        eventTitle,
        eventDescription,
        startDatetime,
        endDatetime,
    } = req.body || {};

    const validationError = validateEventFields(
        eventTitle,
        eventDescription,
        startDatetime,
        endDatetime
    );

    if (validationError) {
        return res.status(400).json({
            message: validationError,
        });
    }

    try {
        // Find the event before checking authorization.
        const event = await findCalendarEventById(eventId);

        if (!event) {
            return res.status(404).json({
                message: 'Calendar event not found.',
            });
        }

        // Find the Mosalinx user connected to Firebase.
        const user = await findUserByFirebaseUid(firebaseUid);

        if (!user) {
            return res.status(404).json({
                message:
                    'Authenticated user is not registered in the database.',
            });
        }

        // Verify that the user belongs to the event's project.
        const role = await findProjectMemberRole(
            event.project_id,
            user.user_id
        );

        if (!role) {
            return res.status(403).json({
                message: 'You are not a member of this project.',
            });
        }

        // Event creators can update their own events.
        const isCreator =
            event.created_by === user.user_id;

        // Project owners can update events created by other members.
        const isProjectOwner =
            role.toLowerCase() === 'owner';

        if (!isCreator && !isProjectOwner) {
            return res.status(403).json({
                message:
                    'You are not authorized to update this event.',
            });
        }

        await updateCalendarEvent(
            eventId,
            eventTitle.trim(),
            typeof eventDescription === 'string'
                ? eventDescription.trim()
                : null,
            startDatetime,
            endDatetime || null
        );

        const updatedEvent =
            await findCalendarEventById(eventId);

        return res.status(200).json({
            event: updatedEvent,
        });
    } catch (error) {
        console.error('Error updating calendar event:', error);

        return res.status(500).json({
            message: 'Failed to update calendar event.',
        });
    }
};

// Delete a calendar event.
const deleteEvent = async (req, res) => {
    const { eventId } = req.params;
    const firebaseUid = req.user?.uid;

    if (!isValidId(eventId)) {
        return res.status(400).json({
            message: 'eventId must be a valid number.',
        });
    }

    if (!firebaseUid) {
        return res.status(401).json({
            message: 'Unauthorized.',
        });
    }

    try {
        // Find the event before checking authorization.
        const event = await findCalendarEventById(eventId);

        if (!event) {
            return res.status(404).json({
                message: 'Calendar event not found.',
            });
        }

        // Find the Mosalinx user connected to Firebase.
        const user = await findUserByFirebaseUid(firebaseUid);

        if (!user) {
            return res.status(404).json({
                message:
                    'Authenticated user is not registered in the database.',
            });
        }

        // Verify that the user belongs to the event's project.
        const role = await findProjectMemberRole(
            event.project_id,
            user.user_id
        );

        if (!role) {
            return res.status(403).json({
                message: 'You are not a member of this project.',
            });
        }

        // Event creators can delete their own events.
        const isCreator =
            event.created_by === user.user_id;

        // Project owners can delete events created by other members.
        const isProjectOwner =
            role.toLowerCase() === 'owner';

        if (!isCreator && !isProjectOwner) {
            return res.status(403).json({
                message:
                    'You are not authorized to delete this event.',
            });
        }

        await deleteCalendarEvent(eventId);

        return res.status(200).json({
            message: 'Calendar event deleted successfully.',
            eventId: event.event_id,
        });
    } catch (error) {
        console.error('Error deleting calendar event:', error);

        return res.status(500).json({
            message: 'Failed to delete calendar event.',
        });
    }
};

module.exports = {
    createEvent,
    getEventsByProject,
    updateEvent,
    deleteEvent,
};
