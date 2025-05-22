import React from 'react';
import {
  Box,
  Flex,
  Button,
  Text,
  useToast,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Avatar,
  useColorModeValue,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import axios from '../../utils/axios';

const Navbar = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  // Safely get user data from localStorage
  const getUserData = () => {
    try {
      const userData = localStorage.getItem('user');
      // Check if userData is null, undefined, or the string "undefined"
      if (!userData || userData === 'undefined') {
        return { name: 'User' };
      }
      
      const parsedData = JSON.parse(userData);
      // Check if parsedData is null or undefined
      if (!parsedData) {
        return { name: 'User' };
      }
      
      return parsedData;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return { name: 'User' };
    }
  };

  const user = getUserData();
  const userType = localStorage.getItem('userType') || 'user';

  const handleLogout = async () => {
    try {
      await axios.post('/logout');
      
      // Clear local storage
      localStorage.removeItem('token');
      localStorage.removeItem('userType');
      localStorage.removeItem('user');

      toast({
        title: 'Logged out successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: 'Error',
        description: 'Failed to logout. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Box
      bg={bgColor}
      borderBottom="1px"
      borderColor={borderColor}
      position="sticky"
      top={0}
      zIndex={1000}
    >
      <Flex
        maxW="container.xl"
        mx="auto"
        px={4}
        py={4}
        align="center"
        justify="space-between"
      >
        <Text
          fontSize="xl"
          fontWeight="bold"
          color="brand.primary"
          cursor="pointer"
          onClick={() => navigate(`/${userType}/dashboard`)}
        >
          DrDriving
        </Text>

        <Flex align="center" gap={4}>
          <Menu>
            <MenuButton
              as={Button}
              variant="ghost"
              rounded="full"
              cursor="pointer"
              minW={0}
            >
              <Avatar
                size="sm"
                name={user?.name || 'User'}
                bg="brand.primary"
                color="white"
              />
            </MenuButton>
            <MenuList>
              <MenuItem onClick={() => navigate(`/${userType}/profile`)}>
                Profile
              </MenuItem>
              <MenuItem onClick={handleLogout}>Logout</MenuItem>
            </MenuList>
          </Menu>
        </Flex>
      </Flex>
    </Box>
  );
};

export default Navbar; 