import React from 'react';
import { Box, Typography, Grid } from '@mui/material';
import { styled } from '@mui/material/styles';

const StatsCard = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.background.paper,
  height: '100%'
}));

const StatsNumber = styled(Typography)(({ theme }) => ({
  fontSize: '2.5rem',
  fontWeight: 'bold',
  color: theme.palette.primary.main
}));

const StatsLabel = styled(Typography)(({ theme }) => ({
  fontSize: '1.1rem',
  color: theme.palette.text.secondary
}));

const DPIStats = ({ stats }) => {
  if (
    !stats ||
    stats.status !== 'success' ||
    !stats.data ||
    stats.data.status === 'error' ||  !Array.isArray(stats.data?.data)
  ) {
    return (
      <StatsCard>
        <Typography variant="h6" color="error">
          ❌ DPI data not available
        </Typography>
      </StatsCard>
    );
  }

  const rawData = stats.data.data;

  const protocolCounts = {};
  let totalPackets = 0;

  rawData.forEach((entry) => {
    const proto = entry.protocol;
    const value = entry.value || 0;
    if (!protocolCounts[proto]) {
      protocolCounts[proto] = 0;
    }
    protocolCounts[proto] += value;
    totalPackets += value;
  });

  return (
    <StatsCard>
      <Typography variant="h5" gutterBottom>
        DPI Protocol Statistics
      </Typography>
      <Typography variant="body2" gutterBottom>
        Captured Packets: {totalPackets}
      </Typography>
      <Grid container spacing={2} justifyContent="center">
        {Object.entries(protocolCounts).map(([proto, count]) => (
          <Grid item key={proto}>
            <Box sx={{ textAlign: 'center' }}>
              <StatsNumber>{count}</StatsNumber>
              <StatsLabel>{proto}</StatsLabel>
            </Box>
          </Grid>
        ))}
      </Grid>
    </StatsCard>
  );
};

export default DPIStats;
