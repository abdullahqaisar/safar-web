import { Station } from '@/types/station';

export async function calculateWalkingTime(
  origin: google.maps.LatLngLiteral,
  destination: google.maps.LatLngLiteral
): Promise<{ duration: number; distance: number } | null> {
  try {
    const service = new google.maps.DistanceMatrixService();
    const response = await service.getDistanceMatrix({
      origins: [origin],
      destinations: [destination],
      travelMode: google.maps.TravelMode.WALKING,
    });

    if (response.rows[0]?.elements[0]?.status === 'OK') {
      const result = response.rows[0].elements[0];
      const distance = result.distance.value; // in meters

      // Return null if walking distance is more than 4km
      if (distance > 4000) return null;

      return {
        duration: result.duration.value, // in seconds
        distance: distance,
      };
    }
    return null;
  } catch (error) {
    console.error('Error calculating walking time:', error);
    return null;
  }
}

export async function calculateTransitTime(
  origin: Station,
  destination: Station
): Promise<number> {
  try {
    const service = new google.maps.DistanceMatrixService();
    const response = await service.getDistanceMatrix({
      origins: [{ lat: origin.coordinates.lat, lng: origin.coordinates.lng }],
      destinations: [
        { lat: destination.coordinates.lat, lng: destination.coordinates.lng },
      ],
      travelMode: google.maps.TravelMode.DRIVING, // Using DRIVING as proxy for bus travel time
    });

    if (response.rows[0]?.elements[0]?.status === 'OK') {
      return response.rows[0].elements[0].duration.value; // in seconds
    }
    return 0;
  } catch (error) {
    console.error('Error calculating transit time:', error);
    return 0;
  }
}
