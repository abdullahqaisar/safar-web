// Constants
export const EARTH_RADIUS_KM = 6371;
export const AVG_WALKING_SPEED_KM_H = 5;
export const AVG_WALKING_SPEED_M_MIN = (AVG_WALKING_SPEED_KM_H * 1000) / 60;
export const DEFAULT_STOP_WAIT_TIME = 20; // seconds
export const WALKING_MAX_DISTANCE = 800; // meters
export const INTERCHANGE_WALKING_TIME = 120; // seconds (time to change platforms)

// Constants for enhanced transit time calculation
export const AVG_METRO_SPEED_KMH = 60; // Average metro speed in km/h
export const AVG_METRO_SPEED_MS = (AVG_METRO_SPEED_KMH * 1000) / 3600; // Converted to m/s
export const ACCELERATION_FACTOR = 0.2; // Time added for acceleration/deceleration

export const DISTANCE_MATRIX_API_URL =
  'https://maps.googleapis.com/maps/api/distancematrix/json';
