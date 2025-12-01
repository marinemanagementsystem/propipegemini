import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Box, CircularProgress } from '@mui/material';

interface ProtectedRouteProps {
      children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
      const { currentUserAuth, loading } = useAuth();

      if (loading) {
            return (
                  <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
                        <CircularProgress />
                  </Box>
            );
      }

      if (!currentUserAuth) {
            return <Navigate to="/login" replace />;
      }

      return <>{children}</>;
};

export default ProtectedRoute;
