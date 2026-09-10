/**
 * @file telemetryExport.js
 * @description Export utilities to package AeroInsight telemetry into standard GIS and aviation formats:
 * - RFC 7946 GeoJSON FeatureCollection (for QGIS, ArcGIS, Google Earth, and Cesium)
 * - PX4 / ArduPilot compatible CSV format (for Mission Planner, QGroundControl, and blackbox log analyzers)
 */

/**
 * Triggers a browser download of text content as a file.
 *
 * @param {string} filename - Target filename with extension.
 * @param {string} content - Serialized string content.
 * @param {string} mimeType - MIME type string (e.g. 'application/json' or 'text/csv').
 */
export function downloadFile(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Converts telemetry data into RFC 7946 compliant GeoJSON.
 *
 * @param {string} flightId - Identifier of the flight.
 * @param {Array<Object>} telemetry - Telemetry points array.
 * @returns {string} Serialized GeoJSON string.
 */
export function exportToGeoJSON(flightId, telemetry = []) {
  if (!telemetry || telemetry.length === 0) return JSON.stringify({}, null, 2);

  const coordinates = telemetry.map((pt) => [pt.longitude, pt.latitude, pt.altitude]);

  const trajectoryFeature = {
    type: 'Feature',
    properties: {
      flightId,
      name: `Flight ${flightId} Trajectory`,
      totalPoints: telemetry.length,
      startAltitude: telemetry[0].altitude,
      endAltitude: telemetry[telemetry.length - 1].altitude,
    },
    geometry: {
      type: 'LineString',
      coordinates,
    },
  };

  const anomalyFeatures = telemetry
    .filter((pt) => pt.issue && pt.issue.toLowerCase() !== 'none' && pt.issue.trim() !== '')
    .map((pt, idx) => ({
      type: 'Feature',
      properties: {
        flightId,
        anomalyIndex: idx + 1,
        issue: pt.issue,
        battery: pt.battery,
        altitude: pt.altitude,
        timestamp: pt.timestamp,
      },
      geometry: {
        type: 'Point',
        coordinates: [pt.longitude, pt.latitude, pt.altitude],
      },
    }));

  const featureCollection = {
    type: 'FeatureCollection',
    features: [trajectoryFeature, ...anomalyFeatures],
  };

  return JSON.stringify(featureCollection, null, 2);
}

/**
 * Converts telemetry data into standard PX4/ArduPilot CSV flight log format.
 *
 * @param {string} flightId - Identifier of the flight.
 * @param {Array<Object>} telemetry - Telemetry points array.
 * @returns {string} Formatted CSV text string.
 */
export function exportToPX4CSV(flightId, telemetry = []) {
  const header = ['timestamp_utc', 'latitude_deg', 'longitude_deg', 'altitude_m_agl', 'battery_pct', 'anomaly_flag'];

  const rows = (telemetry || []).map((pt) => {
    const issueClean = (pt.issue && pt.issue.toLowerCase() !== 'none') ? `"${pt.issue.replace(/"/g, '""')}"` : 'NONE';
    return [
      pt.timestamp || new Date().toISOString(),
      pt.latitude.toFixed(7),
      pt.longitude.toFixed(7),
      pt.altitude.toFixed(2),
      pt.battery.toFixed(1),
      issueClean,
    ].join(',');
  });

  return [header.join(','), ...rows].join('\n');
}
