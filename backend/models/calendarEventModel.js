const pool = require('../config/database');

// Create a new calendar event.
const createCalendarEvent = async (
    projectId,
    createdBy,
    eventTitle,
    eventDescription,
    startDatetime,
    endDatetime
) => {
    const [result] = await pool.query(
        `INSERT INTO calendar_events
        (
            project_id,
            created_by,
            event_title,
            event_description,
            start_datetime,
            end_datetime
        )
        VALUES (?, ?, ?, ?, ?, ?)`,
        [
            projectId,
            createdBy,
            eventTitle,
            eventDescription,
            startDatetime,
            endDatetime,
        ]
    );

    return {
        eventId: result.insertId,
        projectId,
        createdBy,
        eventTitle,
        eventDescription,
        startDatetime,
        endDatetime,
    };
};

// Find one calendar event by ID.
const findCalendarEventById = async (eventId) => {
    const [rows] = await pool.query(
        `SELECT
            event_id,
            project_id,
            created_by,
            event_title,
            event_description,
            start_datetime,
            end_datetime,
            created_at,
            updated_at
        FROM calendar_events
        WHERE event_id = ?
        LIMIT 1`,
        [eventId]
    );

    return rows[0] || null;
};

// Find all calendar events belonging to a project.
const findCalendarEventsByProject = async (projectId) => {
    const [rows] = await pool.query(
        `SELECT
            event_id,
            project_id,
            created_by,
            event_title,
            event_description,
            start_datetime,
            end_datetime,
            created_at,
            updated_at
        FROM calendar_events
        WHERE project_id = ?
        ORDER BY start_datetime ASC`,
        [projectId]
    );

    return rows;
};

// Update a calendar event.
const updateCalendarEvent = async (
    eventId,
    eventTitle,
    eventDescription,
    startDatetime,
    endDatetime
) => {
    const [result] = await pool.query(
        `UPDATE calendar_events
        SET
            event_title = ?,
            event_description = ?,
            start_datetime = ?,
            end_datetime = ?
        WHERE event_id = ?`,
        [
            eventTitle,
            eventDescription,
            startDatetime,
            endDatetime,
            eventId,
        ]
    );

    return result.affectedRows > 0;
};

// Delete a calendar event.
const deleteCalendarEvent = async (eventId) => {
    const [result] = await pool.query(
        'DELETE FROM calendar_events WHERE event_id = ?',
        [eventId]
    );

    return result.affectedRows > 0;
};

module.exports = {
    createCalendarEvent,
    findCalendarEventById,
    findCalendarEventsByProject,
    updateCalendarEvent,
    deleteCalendarEvent,
};
