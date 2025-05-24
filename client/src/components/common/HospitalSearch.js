import React, { useState } from 'react';
import {
  Box,
  Input,
  Button,
  VStack,
  Text,
  Card,
  CardBody,
  Heading,
  Spinner,
  useToast,
  HStack,
  IconButton,
} from '@chakra-ui/react';
import { FaSearch, FaMapMarkerAlt, FaPhone, FaClock } from 'react-icons/fa';

const HospitalSearch = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [hospitals, setHospitals] = useState([]);
  const toast = useToast();

  const findNearbyHospitals = async (latitude, longitude, radius = 5000) => {
    try {
      const query = `
        [out:json][timeout:25];
        (
          node["amenity"="hospital"]["name"](around:${radius},${latitude},${longitude});
          way["amenity"="hospital"]["name"](around:${radius},${latitude},${longitude});
        );
        out body;
        >;
        out skel qt;
      `;
      
      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: query
      });
      
      const data = await response.json();
      
      // Filter and sort hospitals
      const validHospitals = data.elements
        .filter(hospital => {
          // Only include hospitals with names and valid coordinates
          return hospital.tags?.name && 
                 hospital.lat && 
                 hospital.lon &&
                 !isNaN(parseFloat(hospital.lat)) && 
                 !isNaN(parseFloat(hospital.lon));
        })
        .map(hospital => {
          try {
            const distance = calculateDistance(
              parseFloat(latitude),
              parseFloat(longitude),
              parseFloat(hospital.lat),
              parseFloat(hospital.lon)
            );
            return {
              ...hospital,
              distance: distance
            };
          } catch (error) {
            console.error('Error calculating distance:', error);
            return null;
          }
        })
        .filter(hospital => hospital !== null) // Remove any hospitals with failed distance calculations
        .sort((a, b) => a.distance - b.distance) // Sort by distance
        .slice(0, 10); // Take only the 10 closest

      return validHospitals;
    } catch (error) {
      console.error('Error finding hospitals:', error);
      return [];
    }
  };

  // Calculate distance between two points using Haversine formula
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    // Convert all inputs to numbers and validate
    lat1 = parseFloat(lat1);
    lon1 = parseFloat(lon1);
    lat2 = parseFloat(lat2);
    lon2 = parseFloat(lon2);

    if (isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) {
      throw new Error('Invalid coordinates: All coordinates must be valid numbers');
    }

    if (lat1 < -90 || lat1 > 90 || lat2 < -90 || lat2 > 90) {
      throw new Error('Invalid latitude: Must be between -90 and 90 degrees');
    }

    if (lon1 < -180 || lon1 > 180 || lon2 < -180 || lon2 > 180) {
      throw new Error('Invalid longitude: Must be between -180 and 180 degrees');
    }

    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in kilometers
  };

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    try {
      // First, geocode the location to get coordinates
      const geocodeResponse = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `q=${encodeURIComponent(query)}&` +
        `format=json&` +
        `limit=1`
      );
      
      const geocodeData = await geocodeResponse.json();
      
      if (!geocodeData.length) {
        toast({
          title: 'Location not found',
          description: 'Please enter a valid location',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      const { lat, lon } = geocodeData[0];
      
      // Validate geocoded coordinates
      if (!lat || !lon || isNaN(parseFloat(lat)) || isNaN(parseFloat(lon))) {
        toast({
          title: 'Invalid coordinates',
          description: 'Could not get valid coordinates for this location',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      // Then find nearby hospitals
      const hospitals = await findNearbyHospitals(lat, lon);
      
      if (!hospitals.length) {
        toast({
          title: 'No hospitals found',
          description: 'No hospitals found in this area',
          status: 'warning',
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      setHospitals(hospitals);
    } catch (error) {
      console.error('Error searching hospitals:', error);
      toast({
        title: 'Error',
        description: 'Failed to search for hospitals. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <VStack spacing={4} align="stretch">
        <HStack>
          <Input
            placeholder="Enter location (e.g., New York, NY)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <IconButton
            colorScheme="blue"
            icon={<FaSearch />}
            onClick={handleSearch}
            isLoading={loading}
          />
        </HStack>

        {loading && (
          <Box textAlign="center" py={4}>
            <Spinner />
            <Text mt={2}>Searching for hospitals...</Text>
          </Box>
        )}

        {hospitals.length > 0 && (
          <VStack spacing={4} align="stretch">
            <Heading size="md">10 Closest Hospitals</Heading>
            {hospitals.map((hospital) => (
              <Card key={hospital.id} variant="outline">
                <CardBody>
                  <VStack align="start" spacing={2}>
                    <Heading size="sm">{hospital.tags.name}</Heading>
                    
                    {typeof hospital.distance === 'number' && (
                      <Text color="blue.500" fontWeight="medium">
                        {hospital.distance.toFixed(1)} km away
                      </Text>
                    )}
                    
                    {hospital.tags?.['addr:street'] && (
                      <Text color="gray.600">
                        <FaMapMarkerAlt style={{ display: 'inline', marginRight: '4px' }} />
                        {hospital.tags['addr:housenumber']} {hospital.tags['addr:street']}
                        {hospital.tags['addr:city'] && `, ${hospital.tags['addr:city']}`}
                      </Text>
                    )}
                    
                    {hospital.tags?.phone && (
                      <Text color="gray.600">
                        <FaPhone style={{ display: 'inline', marginRight: '4px' }} />
                        {hospital.tags.phone}
                      </Text>
                    )}
                    
                    {hospital.tags?.['opening_hours'] && (
                      <Text color="gray.600">
                        <FaClock style={{ display: 'inline', marginRight: '4px' }} />
                        {hospital.tags['opening_hours']}
                      </Text>
                    )}
                    
                    {hospital.tags?.emergency === 'yes' && (
                      <Text color="red.500" fontWeight="bold">
                        Emergency Services Available
                      </Text>
                    )}
                  </VStack>
                </CardBody>
              </Card>
            ))}
          </VStack>
        )}
      </VStack>
    </Box>
  );
};

export default HospitalSearch; 