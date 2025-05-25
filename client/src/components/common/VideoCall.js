import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Spinner,
  Alert,
  AlertIcon,
  Box,
} from '@chakra-ui/react';

const VideoCall = ({ isOpen, onClose, appointmentId, userType, userName }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [containerNode, setContainerNode] = useState(null); // State to hold the container DOM node
  const jitsiApiRef = useRef(null); // Use useRef to store the Jitsi API instance
  const scriptRef = useRef(null); // Use useRef for the script element to manage cleanup

  // Callback ref for the Jitsi container element
  const setContainerRef = useCallback(node => {
    // React will call this callback with the DOM node when it's mounted
    // and with null when it's unmounted.
    if (node) {
      setContainerNode(node);
    } else {
      setContainerNode(null);
    }
  }, []); // Empty dependency array means this callback is stable

  useEffect(() => {
    // This effect runs when the modal opens, containerNode is available,
    // or relevant props change. It handles the Jitsi API lifecycle.

    if (isOpen && containerNode) { // Only run if modal is open AND container node is available
      setIsLoading(true);
      setError(null);

      // Clear any previous content in the container
      containerNode.innerHTML = '';

      // Load Jitsi Meet API script if not already loaded
      // This effect should ideally not load the script repeatedly.
      // Let's add a separate effect for script loading/removal.

      // Initialize Jitsi Meet External API
      // Check if JitsiMeetExternalAPI is available and modal is still open/container still exists
      if (window.JitsiMeetExternalAPI) {
           try {
             const domain = 'meet.jit.si';
             const options = {
               roomName: `dr-driving-${appointmentId}`,
               width: '100%',
               height: '100%',
               parentNode: containerNode, // Use the containerNode from state
               userInfo: {
                 displayName: userType === 'doctor' ? `Dr. ${userName}` : userName
               },
               configOverwrite: {
                 startWithAudioMuted: true,
                 disableModeratorIndicator: true,
                 startScreenSharing: false,
                 enableEmailInStats: false,
               },
               interfaceConfigOverwrite: {
                 DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
                 TOOLBAR_BUTTONS: [
                   'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
                   'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
                   'shortcuts', 'tileview', 'select-background', 'download', 'help',
                   'mute-everyone', 'security'
                 ],
               },
             };

             // Dispose of existing instance before creating a new one
             if (jitsiApiRef.current) {
                 console.log('Disposing previous Jitsi API instance before creating new.');
                 jitsiApiRef.current.dispose();
             }

             // Create new JitsiMeetExternalAPI instance
             const api = new window.JitsiMeetExternalAPI(domain, options);
             // Store the API instance in the ref
             jitsiApiRef.current = api;

             api.addEventListener('videoConferenceJoined', () => {
               setIsLoading(false);
             });
             api.addEventListener('errorOccurred', (errorObject) => {
               console.error('Jitsi error occurred:', errorObject);
               // Log specific error details if available
               if (errorObject && errorObject.error && errorObject.error.message) {
                 console.error('Jitsi error message:', errorObject.error.message);
               } else if (errorObject && typeof errorObject === 'string') {
                  console.error('Jitsi error string:', errorObject);
               } else {
                 console.error('Jitsi error details unavailable.', errorObject);
               }
               setError('Failed to initialize video call. Please try again.');
               setIsLoading(false);
             });

           } catch (err) {
             console.error('Error initializing JitsiMeetExternalAPI:', err);
             setError('Failed to initialize video call. Please try again.');
             setIsLoading(false);
           }
       } else {
            // JitsiMeetExternalAPI not available - script might not be loaded yet
            console.warn('JitsiMeetExternalAPI not available. Waiting for script.');
            // The script loading effect below will handle this.
       }


      // Cleanup function: dispose Jitsi API when modal closes or dependencies change
      return () => {
        console.log('Running cleanup for Jitsi API effect');
        // Dispose Jitsi API instance if it exists
        if (jitsiApiRef.current) {
          console.log('Disposing Jitsi API instance');
          jitsiApiRef.current.dispose();
          jitsiApiRef.current = null;
        }
         // Also clear the container content on cleanup
        if (containerNode) { // Use containerNode from state
            containerNode.innerHTML = '';
        }
        // Do NOT remove the script element here; it's managed separately.
      };

    } else if (!isOpen && jitsiApiRef.current) {
       // If modal is closed and an API instance exists, dispose it
       console.log('Disposing Jitsi API instance on modal close trigger');
       jitsiApiRef.current.dispose();
       jitsiApiRef.current = null;
       // Also clear the container content when modal is closed
       if (containerNode) { // Use containerNode from state
           containerNode.innerHTML = '';
       }
    }

  }, [isOpen, appointmentId, userType, userName, containerNode]); // Depend on containerNode

   // Effect to load the Jitsi script when the component mounts
   useEffect(() => {
       if (!scriptRef.current) {
           const script = document.createElement('script');
           script.src = 'https://meet.jit.si/external_api.js';
           script.async = true;
           scriptRef.current = script;
           document.body.appendChild(script);

           script.onerror = () => {
             console.error('Failed to load Jitsi script.');
             setError('Failed to load video call script. Please check your internet connection.');
              // Clear the ref if script failed to load so it can be retried
             scriptRef.current = null;
              // Remove the failed script element
             if (document.body.contains(script)) {
                 document.body.removeChild(script);
             }
           };
            // No onload handler here, the other effect waits for window.JitsiMeetExternalAPI
       }

       // Cleanup effect: remove the script when the component unmounts
       return () => {
           console.log('Component unmounting, removing Jitsi script if exists');
           if (scriptRef.current && document.body.contains(scriptRef.current)) {
               document.body.removeChild(scriptRef.current);
               scriptRef.current = null;
           }
       };
   }, []); // Empty dependency array ensures this runs only on mount and unmount


  return (
    <Modal isOpen={isOpen} onClose={onClose} size="full" closeOnOverlayClick={false} closeOnEsc={false} motionPreset="slideInBottom">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Video Consultation</ModalHeader>
        <ModalCloseButton />
        <ModalBody p={0} position="relative">
          {/* Render the container Box and attach the callback ref */}
          <Box 
            ref={setContainerRef} // Use the callback ref here
            id="jitsi-container" // Keep ID for clarity, though ref is primary
            height="100vh" 
            width="100%" 
            position="relative"
          />
          
          {isLoading && (
            <Box
              position="absolute"
              top="50%"
              left="50%"
              transform="translate(-50%, -50%)"
              zIndex="1"
            >
              <Spinner size="xl" />
            </Box>
          )}
          
          {error && (
            <Alert status="error" position="absolute" top="4" left="4" right="4" zIndex="1">
              <AlertIcon />
              {error}
            </Alert>
          )}

        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default VideoCall; 