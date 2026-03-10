const dashboardService = require('../services/dashboardService');

async function getEventStats(req, res, next) {
  try {
    const isAdmin = req.user.role === 'ADMIN';
    const result = await dashboardService.getOrganizerEventStats(
      req.user.id,
      req.params.eventId,
      isAdmin
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getEventStats,
};

